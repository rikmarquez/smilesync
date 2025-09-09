'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  notes?: string
  service?: {
    name: string
  }
  dentist?: {
    name: string
  }
  createdAt: string
}

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  birthDate: string | null
  address?: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PatientHistoryPage({ params }: PageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clinicInfo, setClinicInfo] = useState<{name: string, plan: string} | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setPatientId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (session && patientId) {
      fetchPatientData()
      fetchClinicInfo()
    }
  }, [session, patientId])

  const fetchPatientData = async () => {
    if (!patientId) return
    
    try {
      setLoading(true)
      
      // Fetch patient info
      const patientResponse = await fetch(`/api/patients/${patientId}`)
      if (!patientResponse.ok) {
        throw new Error('Error al cargar información del paciente')
      }
      const patientData = await patientResponse.json()
      setPatient(patientData)

      // Fetch patient appointments
      const appointmentsResponse = await fetch(`/api/appointments?patientId=${patientId}&include=service,dentist`)
      if (!appointmentsResponse.ok) {
        throw new Error('Error al cargar historial de citas')
      }
      const appointmentsData = await appointmentsResponse.json()
      
      // Sort appointments by date (most recent first)
      const sortedAppointments = appointmentsData.sort((a: Appointment, b: Appointment) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      
      setAppointments(sortedAppointments)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const fetchClinicInfo = async () => {
    try {
      const response = await fetch('/api/clinic-info')
      if (response.ok) {
        const info = await response.json()
        setClinicInfo(info)
      }
    } catch (error) {
      console.error('Error fetching clinic info:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada'
      case 'COMPLETED':
        return 'Completada'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return 'Programada'
    }
  }

  const formatBirthDate = (birthDate: string | null) => {
    if (!birthDate) return 'No especificada'
    try {
      // Assume birthDate is in YYYY-MM-DD format
      const [year, month, day] = birthDate.split('T')[0].split('-')
      return `${day}/${month}/${year}`
    } catch {
      return 'Fecha inválida'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={() => router.push('/dashboard/patients')}
            className="mt-3 text-blue-600 hover:text-blue-800 underline"
          >
            Volver a la lista de pacientes
          </button>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Paciente no encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/patients')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Historial de Citas</h1>
              {clinicInfo && (
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-blue-600">🏥 {clinicInfo.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {clinicInfo.plan.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user.name} ({session.user.role})
              </span>
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Patient Info Card */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-medium">
                      {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-600">📧 {patient.email}</p>
                      <p className="text-sm text-gray-600">📱 {patient.phone}</p>
                      <p className="text-sm text-gray-600">🎂 {formatBirthDate(patient.birthDate)}</p>
                      {patient.address && (
                        <p className="text-sm text-gray-600">📍 {patient.address}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total de citas</div>
                  <div className="text-3xl font-bold text-blue-600">{appointments.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Historial de Citas ({appointments.length})
              </h3>
              
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-500 text-lg mb-2">No hay citas registradas</p>
                  <p className="text-gray-400 text-sm">Este paciente aún no tiene citas en el sistema</p>
                  <button
                    onClick={() => router.push('/dashboard/calendar')}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Programar nueva cita
                  </button>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {appointments.map((appointment, idx) => (
                      <li key={appointment.id}>
                        <div className="relative pb-8">
                          {idx !== appointments.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                appointment.status === 'CONFIRMED' 
                                  ? 'bg-green-500' 
                                  : appointment.status === 'COMPLETED'
                                  ? 'bg-blue-500'
                                  : appointment.status === 'CANCELLED'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                              }`}>
                                <span className="text-white text-xs">
                                  {appointment.status === 'CONFIRMED' ? '✓' 
                                   : appointment.status === 'COMPLETED' ? '✅'
                                   : appointment.status === 'CANCELLED' ? '❌'
                                   : '⏳'}
                                </span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h4 className="text-lg font-medium text-gray-900">
                                        {appointment.service?.name || 'Consulta General'}
                                      </h4>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                        {getStatusText(appointment.status)}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                      <div className="flex items-center space-x-1">
                                        <span>📅</span>
                                        <span>{new Date(appointment.startTime).toLocaleDateString('es-MX', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span>🕐</span>
                                        <span>
                                          {new Date(appointment.startTime).toLocaleTimeString('es-MX', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })} - {new Date(appointment.endTime).toLocaleTimeString('es-MX', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span>👨‍⚕️</span>
                                        <span>{appointment.dentist?.name || 'No asignado'}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span>📋</span>
                                        <span>Creada el {new Date(appointment.createdAt).toLocaleDateString('es-MX')}</span>
                                      </div>
                                    </div>
                                    
                                    {appointment.notes && (
                                      <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                                        <div className="flex items-start space-x-2">
                                          <span className="text-gray-400 text-sm mt-0.5">💬</span>
                                          <div>
                                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notas</div>
                                            <p className="text-sm text-gray-700">{appointment.notes}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}