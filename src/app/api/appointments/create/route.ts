import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().min(1, 'Patient phone is required'),
  patientEmail: z.string().email().optional().or(z.literal('')),
  serviceId: z.string().min(1, 'Service is required'),
  dentistId: z.string().min(1, 'Dentist is required'),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().min(15).max(240),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const data = createAppointmentSchema.parse(body)

    // Calculate end time
    const startTime = new Date(data.startTime)
    const endTime = new Date(startTime.getTime() + data.duration * 60 * 1000)

    // Check if patient exists, create if not
    let patient = await db.patient.findFirst({
      where: {
        phone: data.patientPhone,
        organizationId: session.user.organizationId
      }
    })

    if (!patient) {
      // Create new patient
      patient = await db.patient.create({
        data: {
          name: data.patientName,
          phone: data.patientPhone,
          email: data.patientEmail || null,
          organizationId: session.user.organizationId
        }
      })
    }

    // Check for conflicts
    const conflictingAppointment = await db.appointment.findFirst({
      where: {
        organizationId: session.user.organizationId,
        dentistId: data.dentistId,
        OR: [
          // New appointment starts during existing appointment
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          // New appointment ends during existing appointment  
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          // New appointment completely overlaps existing appointment
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ]
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Conflict: There is already an appointment at this time' },
        { status: 409 }
      )
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        startTime,
        endTime,
        status: 'SCHEDULED',
        notes: data.notes || null,
        organizationId: session.user.organizationId,
        patientId: patient.id,
        dentistId: data.dentistId,
        serviceId: data.serviceId
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        dentist: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    })

    // Transform for calendar format
    const calendarAppointment = {
      id: appointment.id,
      title: `${appointment.patient.name} - ${appointment.service?.name || 'Consulta'}`,
      start: appointment.startTime.toISOString(),
      end: appointment.endTime.toISOString(),
      status: appointment.status,
      patient: appointment.patient,
      dentist: appointment.dentist,
      service: appointment.service,
      notes: appointment.notes,
      duration: appointment.service?.duration || data.duration
    }

    return NextResponse.json(calendarAppointment)

  } catch (error) {
    console.error('Create appointment error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}