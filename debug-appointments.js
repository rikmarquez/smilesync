const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Buscando citas en la base de datos...')
  
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: true,
      dentist: true,
      service: true,
    }
  })
  
  console.log('Total de citas:', appointments.length)
  
  appointments.forEach((apt, index) => {
    console.log(`\nCita ${index + 1}:`)
    console.log('  ID:', apt.id)
    console.log('  Fecha y Hora:', apt.startTime)
    console.log('  Fecha y Hora (Local):', apt.startTime.toLocaleString('es-MX'))
    console.log('  Estado:', apt.status)
    console.log('  Paciente:', apt.patient?.name || 'Sin paciente')
    console.log('  Dentista:', apt.dentist?.name || 'Sin dentista')
    console.log('  Servicio:', apt.service?.name || 'Sin servicio')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())