import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured. SMS/WhatsApp reminders will be disabled.')
}

export const twilioClient = accountSid && authToken 
  ? twilio(accountSid, authToken)
  : null

export const sendSMS = async (to: string, message: string, from?: string) => {
  if (!twilioClient) {
    console.log('SMS would be sent to', to, ':', message)
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: from || process.env.TWILIO_PHONE_NUMBER,
      to
    })
    
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error('Error sending SMS:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const sendWhatsApp = async (to: string, message: string, from?: string) => {
  if (!twilioClient) {
    console.log('WhatsApp would be sent to', to, ':', message)
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    // Format phone numbers for WhatsApp
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const whatsappFrom = from 
      ? (from.startsWith('whatsapp:') ? from : `whatsapp:${from}`)
      : process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

    const result = await twilioClient.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    })
    
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error('Error sending WhatsApp:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const generateReminderMessage = (
  patientName: string,
  appointmentDate: Date,
  dentistName: string,
  clinicName: string
) => {
  const date = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const time = appointmentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `Hola ${patientName}! 👋

📅 Recordatorio de tu cita dental:
🗓️ ${date}
⏰ ${time}
👨‍⚕️ Dr. ${dentistName}
🏥 ${clinicName}

Por favor confirma tu asistencia respondiendo:
✅ "SI" para confirmar
❌ "NO" para cancelar

¡Te esperamos! 😊`
}