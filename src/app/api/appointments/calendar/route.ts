import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'week' // day, week, month
    const date = searchParams.get('date') || new Date().toISOString()
    const dentistId = searchParams.get('dentistId') // optional filter

    const selectedDate = new Date(date)

    // Calculate date range based on view
    let startDate: Date
    let endDate: Date

    switch (view) {
      case 'day':
        startDate = startOfDay(selectedDate)
        endDate = endOfDay(selectedDate)
        break
      case 'month':
        startDate = startOfMonth(selectedDate)
        endDate = endOfMonth(selectedDate)
        break
      case 'week':
      default:
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
        endDate = endOfWeek(selectedDate, { weekStartsOn: 1 })
        break
    }

    // Build where clause
    const whereClause: { [key: string]: any } = {
      organizationId: session.user.organizationId,
      startTime: {
        gte: startDate,
        lte: endDate
      }
    }

    // Add dentist filter if specified
    if (dentistId) {
      whereClause.dentistId = dentistId
    }

    // Fetch appointments with related data
    const appointments = await db.appointment.findMany({
      where: whereClause,
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
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Get all dentists for the filter dropdown
    const dentists = await db.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        role: 'DENTIST'
      },
      select: {
        id: true,
        name: true
      }
    })

    // Transform appointments for calendar view
    const calendarAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.patient.name} - ${appointment.service?.name || 'Consulta'}`,
      start: appointment.startTime,
      end: appointment.endTime,
      status: appointment.status,
      patient: appointment.patient,
      dentist: appointment.dentist,
      service: appointment.service,
      notes: appointment.notes,
      duration: appointment.service?.duration || 30
    }))

    // Debug log
    console.log('DEBUG - Calendar API response:', {
      view,
      dateRange: { start: format(startDate, 'yyyy-MM-dd'), end: format(endDate, 'yyyy-MM-dd') },
      appointmentsFound: appointments.length,
      appointments: appointments.map(apt => ({
        id: apt.id,
        startTime: apt.startTime,
        patient: apt.patient?.name,
        dentist: apt.dentist?.name
      }))
    })

    // Generate time slots for the view (8 AM to 8 PM, 30-minute intervals)
    const timeSlots = []
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        timeSlots.push(time)
      }
    }

    return NextResponse.json({
      appointments: calendarAppointments,
      dentists,
      timeSlots,
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      view
    })

  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}