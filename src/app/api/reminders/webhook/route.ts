import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Handle Twilio webhook for incoming messages (confirmations/cancellations)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    if (!from || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Clean phone number (remove whatsapp: prefix if present)
    const phoneNumber = from.replace('whatsapp:', '')
    const messageBody = body.trim().toUpperCase()

    // Find patient by phone number
    const patient = await db.patient.findFirst({
      where: { phone: phoneNumber }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Find upcoming appointments for this patient
    const upcomingAppointments = await db.appointment.findMany({
      where: {
        patientId: patient.id,
        startTime: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        },
        status: { in: ['SCHEDULED'] }
      },
      orderBy: { startTime: 'asc' }
    })

    if (upcomingAppointments.length === 0) {
      return new Response('', { status: 200 })
    }

    // Handle confirmation/cancellation
    const nextAppointment = upcomingAppointments[0]

    if (messageBody.includes('SI') || messageBody.includes('YES') || messageBody.includes('CONFIRMO')) {
      await db.appointment.update({
        where: { id: nextAppointment.id },
        data: { 
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      })
    } else if (messageBody.includes('NO') || messageBody.includes('CANCELO') || messageBody.includes('CANCEL')) {
      await db.appointment.update({
        where: { id: nextAppointment.id },
        data: { status: 'CANCELLED' }
      })
    }

    return new Response('', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('', { status: 200 }) // Always return 200 to Twilio
  }
}