import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendSMS, sendWhatsApp, generateReminderMessage } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentIds, type = 'whatsapp' } = body

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json(
        { error: 'appointmentIds array is required' },
        { status: 400 }
      )
    }

    // Get appointments that belong to user's organization
    const appointments = await db.appointment.findMany({
      where: {
        id: { in: appointmentIds },
        organizationId: session.user.organizationId,
        reminderSent: false,
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      },
      include: {
        patient: true,
        dentist: { select: { name: true } },
        organization: { select: { name: true } }
      }
    })

    const results = []

    for (const appointment of appointments) {
      const message = generateReminderMessage(
        appointment.patient.name,
        appointment.startTime,
        appointment.dentist.name || 'Doctor',
        appointment.organization.name
      )

      let result
      if (type === 'sms') {
        result = await sendSMS(appointment.patient.phone, message)
      } else {
        result = await sendWhatsApp(appointment.patient.phone, message)
      }

      if (result.success) {
        // Mark reminder as sent
        await db.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true }
        })
      }

      results.push({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        phone: appointment.patient.phone,
        success: result.success,
        error: result.error,
        sid: result.sid
      })
    }

    return NextResponse.json({
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results
    })
  } catch (error) {
    console.error('Error sending reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get appointments that need reminders (24 hours before)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get appointments for tomorrow that haven't had reminders sent
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startOfDay = new Date(tomorrow)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(tomorrow)
    endOfDay.setHours(23, 59, 59, 999)

    const appointments = await db.appointment.findMany({
      where: {
        organizationId: session.user.organizationId,
        reminderSent: false,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        patient: true,
        dentist: { select: { name: true } },
        service: { select: { name: true } }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments for reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}