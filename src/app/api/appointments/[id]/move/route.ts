import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const moveAppointmentSchema = z.object({
  newStartTime: z.string().datetime(),
  newDentistId: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const appointmentId = params.id
    const body = await request.json()
    
    const { newStartTime, newDentistId } = moveAppointmentSchema.parse(body)

    // Get the existing appointment
    const existingAppointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        organizationId: session.user.organizationId
      },
      include: {
        service: true
      }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Calculate new end time based on service duration or existing duration
    const durationMinutes = existingAppointment.service?.duration || 30
    const newStart = new Date(newStartTime)
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000)

    // Validate business hours (8 AM to 8 PM)
    const hour = newStart.getHours()
    if (hour < 8 || hour >= 20) {
      return NextResponse.json(
        { error: 'La hora debe estar entre las 8:00 AM y las 8:00 PM' },
        { status: 400 }
      )
    }

    // Check for conflicts with the target dentist
    const targetDentistId = newDentistId || existingAppointment.dentistId
    
    const conflictingAppointment = await db.appointment.findFirst({
      where: {
        id: { not: appointmentId }, // Exclude current appointment
        organizationId: session.user.organizationId,
        dentistId: targetDentistId,
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [
              { startTime: { lte: newStart } },
              { endTime: { gt: newStart } }
            ]
          },
          {
            // New appointment ends during existing appointment
            AND: [
              { startTime: { lt: newEnd } },
              { endTime: { gte: newEnd } }
            ]
          },
          {
            // New appointment completely contains existing appointment
            AND: [
              { startTime: { gte: newStart } },
              { endTime: { lte: newEnd } }
            ]
          }
        ]
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Ya existe una cita en ese horario para el dentista seleccionado' },
        { status: 409 }
      )
    }

    // Update the appointment
    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId
      },
      data: {
        startTime: newStart,
        endTime: newEnd,
        ...(newDentistId && { dentistId: newDentistId })
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

    return NextResponse.json({
      id: updatedAppointment.id,
      title: `${updatedAppointment.patient.name} - ${updatedAppointment.service?.name || 'Consulta'}`,
      start: updatedAppointment.startTime,
      end: updatedAppointment.endTime,
      status: updatedAppointment.status,
      patient: updatedAppointment.patient,
      dentist: updatedAppointment.dentist,
      service: updatedAppointment.service,
      notes: updatedAppointment.notes,
      duration: updatedAppointment.service?.duration || 30
    })

  } catch (error) {
    console.error('Move appointment error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to move appointment' },
      { status: 500 }
    )
  }
}