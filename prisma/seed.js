const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPassword(password) {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

async function main() {
  console.log('🌱 Starting multi-clinic seed...')

  // 1. Create SUPER_ADMIN (no organization)
  const superAdminPassword = await hashPassword('Acceso979971')
  const superAdmin = await prisma.user.upsert({
    where: { email: 'rik@rikmarquez.com' },
    update: {},
    create: {
      username: 'rik@rikmarquez.com',
      email: 'rik@rikmarquez.com',
      password: superAdminPassword,
      name: 'Rik Márquez',
      role: 'SUPER_ADMIN',
      organizationId: null
    }
  })
  console.log('✅ Super Admin created:', superAdmin.name)

  // 2. Create multiple demo organizations
  const organizations = [
    {
      name: 'Clínica Dental SmileSync Centro',
      email: 'centro@smilesync.com',
      phone: '+521234567890',
      address: 'Av. Reforma 123, CDMX',
      plan: 'premium'
    },
    {
      name: 'Dental Care Norte',
      email: 'norte@dentalcare.com',
      phone: '+521987654321', 
      address: 'Calle Norte 456, Monterrey',
      plan: 'basic'
    },
    {
      name: 'Sonrisas del Sur',
      email: 'sur@sonrisasdelsur.com',
      phone: '+525555666777',
      address: 'Av. Sur 789, Guadalajara',
      plan: 'enterprise'
    }
  ]

  const createdOrgs = []
  for (const org of organizations) {
    const created = await prisma.organization.upsert({
      where: { email: org.email },
      update: {},
      create: org
    })
    createdOrgs.push(created)
  }
  console.log('✅ Organizations created:', createdOrgs.length)

  // 3. Create users for each organization
  const demoPassword = await hashPassword('123456')
  const allUsers = []

  // For organization 1 (SmileSync Centro)
  const org1Users = [
    {
      username: 'admin1@centro.smilesync.com',
      email: 'admin1@centro.smilesync.com',
      password: demoPassword,
      name: 'Dr. Ana García',
      phone: '+521234567891',
      role: 'CLINIC_ADMIN',
      organizationId: createdOrgs[0].id
    },
    {
      username: 'dentist1@centro.smilesync.com',
      email: 'dentist1@centro.smilesync.com', 
      password: demoPassword,
      name: 'Dr. Carlos López',
      phone: '+521234567892',
      role: 'DENTIST',
      organizationId: createdOrgs[0].id
    },
    {
      username: 'recep1@centro.smilesync.com',
      email: 'recep1@centro.smilesync.com',
      password: demoPassword,
      name: 'María Rodríguez',
      phone: '+521234567893', 
      role: 'RECEPTIONIST',
      organizationId: createdOrgs[0].id
    }
  ]

  // For organization 2 (Dental Care Norte)
  const org2Users = [
    {
      username: 'admin@norte.dentalcare.com',
      email: 'admin@norte.dentalcare.com',
      password: demoPassword,
      name: 'Dr. Luis Martínez',
      phone: '+521987654322',
      role: 'CLINIC_ADMIN',
      organizationId: createdOrgs[1].id
    },
    {
      username: 'dentist@norte.dentalcare.com',
      email: 'dentist@norte.dentalcare.com',
      password: demoPassword,
      name: 'Dra. Sofia Herrera',
      phone: '+521987654323',
      role: 'DENTIST', 
      organizationId: createdOrgs[1].id
    }
  ]

  // For organization 3 (Sonrisas del Sur)
  const org3Users = [
    {
      username: 'admin@sur.sonrisasdelsur.com',
      email: 'admin@sur.sonrisasdelsur.com',
      password: demoPassword,
      name: 'Dr. Roberto Jiménez',
      phone: '+525555666778',
      role: 'CLINIC_ADMIN',
      organizationId: createdOrgs[2].id
    },
    {
      username: 'dentist@sur.sonrisasdelsur.com',
      email: 'dentist@sur.sonrisasdelsur.com',
      password: demoPassword,
      name: 'Dra. Carmen Torres',
      phone: '+525555666779',
      role: 'DENTIST',
      organizationId: createdOrgs[2].id
    },
    {
      username: 'recep@sur.sonrisasdelsur.com',
      email: 'recep@sur.sonrisasdelsur.com',
      password: demoPassword,
      name: 'Patricia González',
      phone: '+525555666780',
      role: 'RECEPTIONIST',
      organizationId: createdOrgs[2].id
    }
  ]

  const usersToCreate = [...org1Users, ...org2Users, ...org3Users]
  
  for (const user of usersToCreate) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    })
    allUsers.push(created)
  }
  
  console.log('✅ Users created:', allUsers.length, 'across', createdOrgs.length, 'organizations')

  // 4. Create services for first organization (demo data)
  const services = [
    { name: 'Consulta General', duration: 30, price: 500.00 },
    { name: 'Limpieza Dental', duration: 45, price: 750.00 },
    { name: 'Empaste', duration: 60, price: 1200.00 },
    { name: 'Endodoncia', duration: 90, price: 3000.00 },
    { name: 'Extracción', duration: 30, price: 800.00 },
    { name: 'Ortodoncia - Revisión', duration: 45, price: 1000.00 },
    { name: 'Blanqueamiento', duration: 120, price: 2000.00 }
  ]

  const createdServices = []
  for (const service of services) {
    const created = await prisma.service.upsert({
      where: {
        name_organizationId: {
          name: service.name,
          organizationId: createdOrgs[0].id
        }
      },
      update: {},
      create: {
        ...service,
        organizationId: createdOrgs[0].id
      }
    })
    createdServices.push(created)
  }

  console.log('✅ Services created:', createdServices.length, 'for first organization')

  // 5. Create demo patients for first organization
  const patients = [
    {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+521234567891',
      birthDate: new Date('1985-03-15'),
      address: 'Calle Reforma 45 #12-34, CDMX'
    },
    {
      name: 'Sofia Martín',
      email: 'sofia.martin@email.com',
      phone: '+521234567892',
      birthDate: new Date('1992-07-22'),
      address: 'Av. Insurgentes 20 #56-78, CDMX'
    },
    {
      name: 'Pedro González',
      email: 'pedro.gonzalez@email.com',
      phone: '+521234567893',
      birthDate: new Date('1978-11-08'),
      address: 'Calzada de Tlalpan 68 #89-12, CDMX'
    }
  ]

  const createdPatients = []
  for (const patient of patients) {
    const created = await prisma.patient.upsert({
      where: {
        phone_organizationId: {
          phone: patient.phone,
          organizationId: createdOrgs[0].id
        }
      },
      update: {},
      create: {
        ...patient,
        organizationId: createdOrgs[0].id
      }
    })
    createdPatients.push(created)
  }

  console.log('✅ Patients created:', createdPatients.length, 'for first organization')

  console.log('🎉 Multi-clinic seed completed successfully!')
  console.log('\n📋 Demo credentials (email / contraseña):')
  console.log('🚀 SUPER ADMIN (gestiona todas las clínicas):')
  console.log('   rik@rikmarquez.com / Acceso979971')
  console.log('\n🏥 CLÍNICA 1 - SmileSync Centro:')
  console.log('   admin1@centro.smilesync.com / 123456 (Admin de clínica)')
  console.log('   dentist1@centro.smilesync.com / 123456 (Dentista)')
  console.log('   recep1@centro.smilesync.com / 123456 (Recepcionista)')
  console.log('\n🏥 CLÍNICA 2 - Dental Care Norte:')
  console.log('   admin@norte.dentalcare.com / 123456 (Admin de clínica)')
  console.log('   dentist@norte.dentalcare.com / 123456 (Dentista)')
  console.log('\n🏥 CLÍNICA 3 - Sonrisas del Sur:')
  console.log('   admin@sur.sonrisasdelsur.com / 123456 (Admin de clínica)')
  console.log('   dentist@sur.sonrisasdelsur.com / 123456 (Dentista)')
  console.log('   recep@sur.sonrisasdelsur.com / 123456 (Recepcionista)')
  console.log('\n💡 Cada clínica es independiente con sus propios usuarios y datos')
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