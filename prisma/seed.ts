import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { email: 'demo@smilesync.com' },
    update: {},
    create: {
      name: 'Clínica Dental SmileSync',
      email: 'demo@smilesync.com',
      phone: '+1234567890',
      address: 'Av. Principal 123, Ciudad'
    }
  })

  console.log('✅ Organization created:', org.name)

  // Create demo users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smilesync.com' },
    update: {},
    create: {
      email: 'admin@smilesync.com',
      name: 'Dr. Ana García',
      phone: '+1234567891',
      role: 'ADMIN',
      organizationId: org.id
    }
  })

  const dentistUser = await prisma.user.upsert({
    where: { email: 'dentist@smilesync.com' },
    update: {},
    create: {
      email: 'dentist@smilesync.com',
      name: 'Dr. Carlos López',
      phone: '+1234567892',
      role: 'DENTIST',
      organizationId: org.id
    }
  })

  const receptionistUser = await prisma.user.upsert({
    where: { email: 'recepcion@smilesync.com' },
    update: {},
    create: {
      email: 'recepcion@smilesync.com',
      name: 'María Rodríguez',
      phone: '+1234567893',
      role: 'RECEPTIONIST',
      organizationId: org.id
    }
  })

  console.log('✅ Users created:', { adminUser: adminUser.name, dentistUser: dentistUser.name, receptionist: receptionistUser.name })

  // Create services
  const services = [
    { name: 'Consulta General', duration: 30, price: 50.00 },
    { name: 'Limpieza Dental', duration: 45, price: 75.00 },
    { name: 'Empaste', duration: 60, price: 120.00 },
    { name: 'Endodoncia', duration: 90, price: 300.00 },
    { name: 'Extracción', duration: 30, price: 80.00 },
    { name: 'Ortodoncia - Revisión', duration: 45, price: 100.00 },
    { name: 'Blanqueamiento', duration: 120, price: 200.00 },
  ]

  const createdServices = []
  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: {
        name: service.name,
        organizationId: org.id
      }
    })
    
    if (existing) {
      createdServices.push(existing)
    } else {
      const created = await prisma.service.create({
        data: {
          ...service,
          organizationId: org.id
        }
      })
      createdServices.push(created)
    }
  }

  console.log('✅ Services created:', createdServices.length)

  // Create demo patients
  const patients = [
    {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+573001234567',
      birthDate: new Date('1985-03-15'),
      address: 'Calle 45 #12-34, Bogotá'
    },
    {
      name: 'Sofia Martín',
      email: 'sofia.martin@email.com',
      phone: '+573009876543',
      birthDate: new Date('1992-07-22'),
      address: 'Carrera 20 #56-78, Medellín'
    },
    {
      name: 'Pedro González',
      email: 'pedro.gonzalez@email.com',
      phone: '+573005555555',
      birthDate: new Date('1978-11-08'),
      address: 'Av. 68 #89-12, Cali'
    },
    {
      name: 'Laura Sánchez',
      email: 'laura.sanchez@email.com',
      phone: '+573003333333',
      birthDate: new Date('1990-01-30'),
      address: 'Calle 100 #15-25, Barranquilla'
    },
    {
      name: 'Miguel Torres',
      email: 'miguel.torres@email.com',
      phone: '+573007777777',
      birthDate: new Date('1987-05-12'),
      address: 'Carrera 15 #30-45, Cartagena'
    },
    {
      name: 'Carmen Rivera',
      email: 'carmen.rivera@email.com',
      phone: '+573008888888',
      birthDate: new Date('1995-09-18'),
      address: 'Calle 25 #40-60, Bucaramanga'
    }
  ]

  const createdPatients = []
  for (const patient of patients) {
    const created = await prisma.patient.upsert({
      where: {
        phone_organizationId: {
          phone: patient.phone,
          organizationId: org.id
        }
      },
      update: {},
      create: {
        ...patient,
        organizationId: org.id
      }
    })
    createdPatients.push(created)
  }

  console.log('✅ Patients created:', createdPatients.length)

  // Create appointments
  const today = new Date()
  const appointments = []

  // Today's appointments
  for (let i = 0; i < 5; i++) {
    const startHour = 9 + (i * 2) // 9am, 11am, 1pm, 3pm, 5pm
    const startTime = new Date(today)
    startTime.setHours(startHour, 0, 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + createdServices[i % createdServices.length].duration)

    appointments.push({
      startTime,
      endTime,
      status: i < 3 ? 'CONFIRMED' : 'SCHEDULED',
      patientId: createdPatients[i].id,
      dentistId: i % 2 === 0 ? adminUser.id : dentistUser.id,
      serviceId: createdServices[i % createdServices.length].id,
      organizationId: org.id,
      notes: i === 2 ? 'Paciente con sensibilidad dental' : null
    })
  }

  // Tomorrow's appointments
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  for (let i = 0; i < 4; i++) {
    const startHour = 10 + (i * 2) // 10am, 12pm, 2pm, 4pm
    const startTime = new Date(tomorrow)
    startTime.setHours(startHour, 0, 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + createdServices[i % createdServices.length].duration)

    appointments.push({
      startTime,
      endTime,
      status: 'SCHEDULED',
      patientId: createdPatients[i + 1].id,
      dentistId: i % 2 === 0 ? dentistUser.id : adminUser.id,
      serviceId: createdServices[i + 1].id,
      organizationId: org.id,
      reminderSent: false
    })
  }

  // Next week appointments
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  for (let i = 0; i < 3; i++) {
    const startHour = 9 + (i * 3) // 9am, 12pm, 3pm
    const startTime = new Date(nextWeek)
    startTime.setHours(startHour, 0, 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + createdServices[i + 2].duration)

    appointments.push({
      startTime,
      endTime,
      status: 'SCHEDULED',
      patientId: createdPatients[i + 2].id,
      dentistId: adminUser.id,
      serviceId: createdServices[i + 2].id,
      organizationId: org.id,
      reminderSent: false
    })
  }

  for (const appointment of appointments) {
    await prisma.appointment.create({
      data: appointment
    })
  }

  console.log('✅ Appointments created:', appointments.length)

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Demo credentials:')
  console.log('- Admin: admin@smilesync.com / any password')
  console.log('- Dentist: dentist@smilesync.com / any password')  
  console.log('- Receptionist: recepcion@smilesync.com / any password')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })