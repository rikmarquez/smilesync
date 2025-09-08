const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // First, let's see if there's an organization
  const org = await prisma.organization.findFirst()
  
  if (!org) {
    console.error('No organization found! Please run the main seed script first.')
    process.exit(1)
  }

  console.log(`Found organization: ${org.name} (${org.id})`)

  // Check if services already exist
  const existingServices = await prisma.service.findMany({
    where: { organizationId: org.id }
  })

  if (existingServices.length > 0) {
    console.log(`Found ${existingServices.length} existing services:`)
    existingServices.forEach(service => {
      console.log(`- ${service.name} (${service.id}) - ${service.duration}min - $${service.price || 0}`)
    })
    return
  }

  // Create default services
  const defaultServices = [
    { name: 'Consulta General', duration: 30, price: 500 },
    { name: 'Limpieza Dental', duration: 45, price: 800 },
    { name: 'Empaste', duration: 60, price: 1200 },
    { name: 'Endodoncia', duration: 90, price: 2500 },
    { name: 'Extracción', duration: 30, price: 600 },
    { name: 'Ortodoncia', duration: 45, price: 1500 },
    { name: 'Blanqueamiento', duration: 120, price: 3000 }
  ]

  console.log('Creating default services...')

  for (const service of defaultServices) {
    const created = await prisma.service.create({
      data: {
        ...service,
        organizationId: org.id
      }
    })
    console.log(`✓ Created: ${created.name} (${created.id})`)
  }

  console.log('Services seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })