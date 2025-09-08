'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Organization {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: string
  plan: string
  maxUsers: number
  maxPatients: number
  createdAt: string
  _count: {
    users: number
    patients: number
  }
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrgs: 0,
    activeOrgs: 0,
    totalUsers: 0,
    totalPatients: 0
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchOrganizations()
    }
  }, [session])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        
        // Calculate stats
        const totalUsers = data.reduce((sum: number, org: Organization) => sum + org._count.users, 0)
        const totalPatients = data.reduce((sum: number, org: Organization) => sum + org._count.patients, 0)
        
        setStats({
          totalOrgs: data.length,
          activeOrgs: data.filter((org: Organization) => org.status === 'ACTIVE').length,
          totalUsers,
          totalPatients
        })
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orgId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        fetchOrganizations() // Refresh data
      }
    } catch (error) {
      console.error('Error updating organization status:', error)
    }
  }

  const handleDeleteClinic = async (orgId: string, orgName: string) => {
    const confirmed = window.confirm(
      `⚠️ ¿Estás seguro de que quieres eliminar la clínica "${orgName}"?\n\n` +
      `Esta acción eliminará:\n` +
      `• Todos los usuarios de la clínica\n` +
      `• Todos los pacientes\n` +
      `• Todas las citas\n` +
      `• Todos los servicios\n\n` +
      `Esta acción NO se puede deshacer.`
    )
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/super-admin/organizations/${orgId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchOrganizations() // Refresh data
        alert('✅ Clínica eliminada exitosamente')
      } else {
        const error = await response.json()
        alert(`❌ Error al eliminar clínica: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('❌ Error de conexión al eliminar clínica')
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      case 'TRIAL': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">🚀 SmileSync - Super Administrador</h1>
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
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">🏥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Clínicas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalOrgs}</dd>
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
                      <span className="text-white text-sm font-medium">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Clínicas Activas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeOrgs}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Usuarios</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
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
                      <span className="text-white text-sm font-medium">🦷</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Pacientes</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalPatients}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button 
                  onClick={() => router.push('/dashboard/super-admin/new-clinic')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  ➕ Nueva Clínica
                </button>
                <button 
                  onClick={() => fetchOrganizations()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  🔄 Actualizar
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  📊 Reportes
                </button>
              </div>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Clínicas Registradas</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clínica
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuarios
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pacientes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {organizations.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{org.name}</div>
                            <div className="text-sm text-gray-500">{org.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(org.plan)}`}>
                            {org.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                            {org.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {org._count.users}/{org.maxUsers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {org._count.patients}/{org.maxPatients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(org.createdAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <select
                              value={org.status}
                              onChange={(e) => handleStatusChange(org.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-900"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                              <option value="TRIAL">TRIAL</option>
                            </select>
                            <button
                              onClick={() => router.push(`/dashboard/super-admin/edit-clinic/${org.id}`)}
                              className="text-blue-600 hover:text-blue-900 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                              title="Editar clínica"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDeleteClinic(org.id, org.name)}
                              className="text-red-600 hover:text-red-900 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                              title="Eliminar clínica"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {organizations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay clínicas registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}