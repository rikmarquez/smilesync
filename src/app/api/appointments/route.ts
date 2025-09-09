import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  patientId: z.string(),
  dentistId: z.string(),
  serviceId: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    const where: { [key: string]: any } = {
      organizationId: session.user.organizationId
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (status) {
      where.status = status
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        patient: true,
        dentist: {
          select: { id: true, name: true, email: true }
        },
        service: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('SERVER DEBUG - Received appointment data:', JSON.stringify(body, null, 2))
    console.log('SERVER DEBUG - Session user:', { id: session.user.id, organizationId: session.user.organizationId })
    
    const validatedData = createAppointmentSchema.parse(body)
    console.log('SERVER DEBUG - Validated data:', JSON.stringify(validatedData, null, 2))

    // Check for conflicting appointments
    const conflictingAppointment = await db.appointment.findFirst({
      where: {
        organizationId: session.user.organizationId,
        dentistId: validatedData.dentistId,
        startTime: {
          lt: new Date(validatedData.endTime)
        },
        endTime: {
          gt: new Date(validatedData.startTime)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Time slot already booked' },
        { status: 409 }
      )
    }

    const appointment = await db.appointment.create({
      data: {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
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

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.log('Error details:', error)
    
    if (error instanceof z.ZodError) {
      console.log('Zod error structure:', JSON.stringify(error, null, 2))
      
      // Buscar errores específicos de fecha/hora si existen
      let hasDateTimeError = false
      if (error.errors && Array.isArray(error.errors)) {
        hasDateTimeError = error.errors.some(err => 
          err.path && (err.path.includes('startTime') || err.path.includes('endTime'))
        )
      }
      
      if (hasDateTimeError) {
        return NextResponse.json(
          { error: 'Fecha u hora inválida. Por favor verifica el formato de fecha y hora.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Datos de cita inválidos', details: error.errors || [] },
        { status: 400 }
      )
    }
    
    console.error('Error creating appointment:', error)
    
    // Asegurar que siempre se devuelve un JSON válido
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error interno del servidor'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}