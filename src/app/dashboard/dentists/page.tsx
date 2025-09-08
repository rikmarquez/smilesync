'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Dentist {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  createdAt: string
  updatedAt: string
  _count?: {
    appointments: number
  }
}

export default function DentistsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clinicInfo, setClinicInfo] = useState<{name: string, plan: string} | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDentists()
      fetchClinicInfo()
    }
  }, [session])

  const fetchDentists = async () => {
    try {
      const response = await fetch('/api/dentists')
      if (!response.ok) {
        throw new Error('Error al cargar dentistas')
      }
      const data = await response.json()
      setDentists(data)
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

  const handleDelete = async (dentistId: string, dentistName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al dentista ${dentistName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dentists/${dentistId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar dentista')
      }

      // Refrescar la lista
      fetchDentists()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar dentista')
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

  // Solo admins pueden gestionar dentistas
  if (session.user.role !== 'CLINIC_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
          <p className="text-red-700 mt-1">Solo los administradores pueden gestionar dentistas.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-3 text-blue-600 hover:text-blue-800 underline"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
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
              <h1 className="text-xl font-semibold text-gray-900">Gestión de Dentistas</h1>
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
                onClick={() => router.push('/dashboard/dentists/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Agregar Dentista
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
          {/* Stats */}
          <div className="mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Total de Dentistas</h2>
                  <p className="text-3xl font-bold text-blue-600">{dentists.length}</p>
                </div>
                <div className="text-4xl">🦷</div>
              </div>
            </div>
          </div>

          {/* Dentists Table */}
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
                        Citas
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
                    {dentists.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No hay dentistas registrados
                        </td>
                      </tr>
                    ) : (
                      dentists.map((dentist) => (
                        <tr key={dentist.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {dentist.name || 'Sin nombre'}
                            </div>
                            <div className="text-sm text-gray-500">{dentist.role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{dentist.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{dentist.phone || 'No registrado'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {dentist._count?.appointments || 0} citas
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(dentist.createdAt).toLocaleDateString('es-MX')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => router.push(`/dashboard/dentists/edit/${dentist.id}`)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(dentist.id, dentist.name || dentist.email)}
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