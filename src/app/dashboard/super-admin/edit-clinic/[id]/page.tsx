'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'

interface Organization {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  plan: string
  maxUsers: number
  maxPatients: number
  status: string
  _count: {
    users: number
    patients: number
    appointments: number
    services: number
  }
}

export default function EditClinicPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [organization, setOrganization] = useState<Organization | null>(null)
  
  // Unwrap the params Promise
  const { id } = use(params)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'basic',
    maxUsers: 10,
    maxPatients: 1000,
    status: 'ACTIVE'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    } else {
      fetchOrganization()
    }
  }, [status, session, router])

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/organizations/${id}`)
      if (response.ok) {
        const org = await response.json()
        setOrganization(org)
        setFormData({
          name: org.name,
          email: org.email,
          phone: org.phone || '',
          address: org.address || '',
          plan: org.plan,
          maxUsers: org.maxUsers,
          maxPatients: org.maxPatients,
          status: org.status
        })
      } else {
        setError('Clínica no encontrada')
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
      setError('Error al cargar la clínica')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/super-admin/organizations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/dashboard/super-admin')
      } else {
        const data = await response.json()
        setError(data.error || 'Error actualizando la clínica')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxUsers' || name === 'maxPatients' ? parseInt(value) || 0 : value
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/dashboard/super-admin')}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Volver al dashboard
          </button>
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
                onClick={() => router.push('/dashboard/super-admin')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-semibold text-gray-900">✏️ Editar Clínica</h1>
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
      <main className="mx-auto max-w-3xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Organization Stats */}
          {organization && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📊 Estadísticas de la Clínica</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-blue-700">
                <div>👥 Usuarios: {organization._count.users}</div>
                <div>🦷 Pacientes: {organization._count.patients}</div>
                <div>📅 Citas: {organization._count.appointments}</div>
                <div>🛠️ Servicios: {organization._count.services}</div>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Información de la Clínica
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre de la Clínica *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                      Plan
                    </label>
                    <select
                      name="plan"
                      id="plan"
                      value={formData.plan}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    >
                      <option value="basic">Básico</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>

                {/* Status and Limits */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Configuración y Límites</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      >
                        <option value="ACTIVE">ACTIVO</option>
                        <option value="INACTIVE">INACTIVO</option>
                        <option value="SUSPENDED">SUSPENDIDO</option>
                        <option value="TRIAL">PRUEBA</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700">
                        Máximo de Usuarios
                      </label>
                      <input
                        type="number"
                        name="maxUsers"
                        id="maxUsers"
                        min="1"
                        max="100"
                        value={formData.maxUsers}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="maxPatients" className="block text-sm font-medium text-gray-700">
                        Máximo de Pacientes
                      </label>
                      <input
                        type="number"
                        name="maxPatients"
                        id="maxPatients"
                        min="100"
                        max="10000"
                        value={formData.maxPatients}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/super-admin')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}