'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [patientsCount, setPatientsCount] = useState<number>(0)
  const [appointmentsStats, setAppointmentsStats] = useState({
    today: 0,
    confirmed: 0,
    pending: 0
  })
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      // Fetch patients count
      const patientsResponse = await fetch('/api/patients')
      if (patientsResponse.ok) {
        const patients = await patientsResponse.json()
        setPatientsCount(patients.length)
      }

      // Fetch appointments for today
      const today = new Date().toISOString().split('T')[0]
      const appointmentsResponse = await fetch(`/api/appointments?date=${today}&include=patient,dentist,service`)
      if (appointmentsResponse.ok) {
        const appointments = await appointmentsResponse.json()
        const confirmed = appointments.filter((a: any) => a.status === 'CONFIRMED').length
        const pending = appointments.filter((a: any) => a.status === 'SCHEDULED').length
        
        setAppointmentsStats({
          today: appointments.length,
          confirmed: confirmed,
          pending: pending
        })
        
        setTodayAppointments(appointments.slice(0, 5)) // Solo mostrar las primeras 5
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SmileSync</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user.name} ({session.user.role})
              </span>
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">📅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Citas de Hoy
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{appointmentsStats.today}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Confirmadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{appointmentsStats.confirmed}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pendientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{appointmentsStats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Pacientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{patientsCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button 
                  onClick={() => router.push('/dashboard/calendar')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  📅 Calendario
                </button>
                <button 
                  onClick={() => router.push('/dashboard/appointments/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Nueva Cita
                </button>
                <button 
                  onClick={() => router.push('/dashboard/patients/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Agregar Paciente
                </button>
                <button 
                  onClick={() => router.push('/dashboard/patients')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ver Pacientes
                </button>
              </div>
              
              {/* Admin Actions */}
              {session?.user?.role === 'ADMIN' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Administración</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <button 
                      onClick={() => router.push('/dashboard/dentists')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Gestionar Dentistas
                    </button>
                    <button 
                      onClick={() => router.push('/dashboard/services')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Gestionar Servicios
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Configuración
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Citas de Hoy
              </h3>
              <div className="flow-root">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay citas programadas para hoy</p>
                    <button
                      onClick={() => router.push('/dashboard/appointments/new')}
                      className="mt-3 text-blue-600 hover:text-blue-800 underline"
                    >
                      Programar nueva cita
                    </button>
                  </div>
                ) : (
                  <ul className="-mb-8">
                    {todayAppointments.map((appointment, idx) => (
                      <li key={appointment.id}>
                        <div className="relative pb-8">
                          {idx !== todayAppointments.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                appointment.status === 'CONFIRMED' 
                                  ? 'bg-green-500' 
                                  : 'bg-yellow-500'
                              }`}>
                                <span className="text-white text-xs">
                                  {appointment.status === 'CONFIRMED' ? '✓' : '⏳'}
                                </span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">
                                    {new Date(appointment.startTime).toLocaleTimeString('es-MX', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span> - {appointment.patient?.name || 'Paciente sin nombre'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {appointment.service?.name || 'Consulta'} • {appointment.dentist?.name || 'Dr. Sin nombre'}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  appointment.status === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-800'
                                    : appointment.status === 'COMPLETED'
                                    ? 'bg-blue-100 text-blue-800'  
                                    : appointment.status === 'CANCELLED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appointment.status === 'CONFIRMED' ? 'confirmada' 
                                   : appointment.status === 'COMPLETED' ? 'completada'
                                   : appointment.status === 'CANCELLED' ? 'cancelada' 
                                   : 'programada'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}