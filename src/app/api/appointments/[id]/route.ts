import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateAppointmentSchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  patientId: z.string().optional(),
  dentistId: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const appointment = await db.appointment.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      },
      include: {
        patient: true,
        dentist: {
          select: { id: true, name: true, email: true }
        },
        service: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('PATCH request body:', JSON.stringify(body, null, 2))
    
    const validatedData = updateAppointmentSchema.parse(body)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))

    // Await params in Next.js 15
    const { id } = await params
    
    // Check if appointment exists and belongs to user's organization
    const existingAppointment = await db.appointment.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // If updating time or dentist, check for conflicts
    if (validatedData.startTime || validatedData.endTime || validatedData.dentistId) {
      const startTime = validatedData.startTime 
        ? new Date(validatedData.startTime) 
        : existingAppointment.startTime
      const endTime = validatedData.endTime 
        ? new Date(validatedData.endTime) 
        : existingAppointment.endTime
      const dentistId = validatedData.dentistId || existingAppointment.dentistId

      const conflictingAppointment = await db.appointment.findFirst({
        where: {
          id: { not: id },
          organizationId: session.user.organizationId,
          dentistId: dentistId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          status: { in: ['SCHEDULED', 'CONFIRMED'] }
        }
      })

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: 'Time slot already booked' },
          { status: 409 }
        )
      }
    }

    const updateData: { [key: string]: any } = {}
    if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime)
    if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime)
    if (validatedData.patientId) updateData.patientId = validatedData.patientId
    if (validatedData.dentistId) updateData.dentistId = validatedData.dentistId
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.serviceId !== undefined) updateData.serviceId = validatedData.serviceId

    const appointment = await db.appointment.update({
      where: { id: id },
      data: updateData,
      include: {
        patient: true,
        dentist: {
          select: { id: true, name: true, email: true }
        },
        service: true
      }
    })

    return NextResponse.json(appointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const appointment = await db.appointment.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await db.appointment.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}