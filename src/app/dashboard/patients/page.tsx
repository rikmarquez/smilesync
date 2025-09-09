'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatBirthDate } from '@/lib/utils'

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  birthDate: string | null
  address?: string | null
  medicalHistory?: string
  createdAt: string
  updatedAt: string
}

export default function PatientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clinicInfo, setClinicInfo] = useState<{name: string, plan: string} | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchPatients()
      fetchClinicInfo()
    }
  }, [session])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (!response.ok) {
        throw new Error('Error al cargar pacientes')
      }
      const data = await response.json()
      setPatients(data)
      setFilteredPatients(data)
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

  // Función de búsqueda y filtrado
  useEffect(() => {
    let filtered = patients.filter(patient => 
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm)
    )

    // Ordenar
    filtered.sort((a, b) => {
      let compareValue = 0
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name)
      } else {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredPatients(filtered)
  }, [patients, searchTerm, sortBy, sortOrder])

  const handleEdit = (patientId: string) => {
    router.push(`/dashboard/patients/edit/${patientId}`)
  }

  const handleViewHistory = (patientId: string) => {
    router.push(`/dashboard/patients/${patientId}/history`)
  }

  const handleDelete = async (patientId: string, patientName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al paciente ${patientName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar paciente')
      }

      // Refrescar la lista
      fetchPatients()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar paciente')
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
        </div>
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
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Lista de Pacientes</h1>
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
              <button
                onClick={() => router.push('/dashboard/patients/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Agregar Paciente
              </button>
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
          {/* Search and Filter Bar */}
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <label htmlFor="search" className="sr-only">Buscar pacientes</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                  <input
                    id="search"
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Ordenar por:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt')}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name">Nombre</option>
                    <option value="createdAt">Fecha de registro</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {filteredPatients.length} de {patients.length} pacientes
                </div>
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Nacimiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          {searchTerm ? 'No se encontraron pacientes que coincidan con la búsqueda' : 'No hay pacientes registrados'}
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{patient.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{patient.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatBirthDate(patient.birthDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(patient.createdAt).toLocaleDateString('es-MX')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewHistory(patient.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Historial
                            </button>
                            <button
                              onClick={() => handleEdit(patient.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(patient.id, patient.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}