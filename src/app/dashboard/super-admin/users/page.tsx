'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Organization {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  role: 'CLINIC_ADMIN' | 'DENTIST' | 'RECEPTIONIST'
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
  }
}

interface UserManagementData {
  organization: Organization
  users: User[]
  total: number
}

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [userManagementData, setUserManagementData] = useState<UserManagementData | null>(null)
  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Formulario para nuevo usuario
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DENTIST' as 'CLINIC_ADMIN' | 'DENTIST' | 'RECEPTIONIST',
  })

  // Formulario para editar usuario
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    role: 'DENTIST' as 'CLINIC_ADMIN' | 'DENTIST' | 'RECEPTIONIST',
  })

  // Formulario para cambiar contraseña
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  // Función para cargar organizaciones
  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/organizations')
      if (!response.ok) throw new Error('Error al cargar clínicas')
      
      const data = await response.json()
      setOrganizations(data || [])
    } catch (error) {
      setError('Error al cargar clínicas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar usuarios
  const fetchUsers = async (organizationId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/super-admin/users?organizationId=${organizationId}`)
      if (!response.ok) throw new Error('Error al cargar usuarios')
      
      const data = await response.json()
      setUserManagementData(data)
    } catch (error) {
      setError('Error al cargar usuarios')
      console.error(error)
      setUserManagementData(null)
    } finally {
      setLoading(false)
    }
  }

  // Cargar organizaciones al montar
  useEffect(() => {
    fetchOrganizations()
  }, [])

  // Cargar usuarios cuando se selecciona una organización
  useEffect(() => {
    if (selectedOrgId) {
      fetchUsers(selectedOrgId)
    }
  }, [selectedOrgId])

  // Verificar autenticación
  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Cargando...</div>
    </div>
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/auth/signin')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId) return

    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserForm,
          organizationId: selectedOrgId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear usuario')
      }

      await fetchUsers(selectedOrgId)
      setShowNewUserModal(false)
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        role: 'DENTIST',
      })
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar usuario')
      }

      await fetchUsers(selectedOrgId)
      setShowEditModal(false)
      setSelectedUser(null)
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar contraseña')
      }

      setShowPasswordModal(false)
      setSelectedUser(null)
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setError(null)
      alert('Contraseña cambiada exitosamente')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar usuario')
      }

      await fetchUsers(selectedOrgId)
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar usuario')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
    })
    setShowEditModal(true)
  }

  const openPasswordModal = (user: User) => {
    setSelectedUser(user)
    setPasswordForm({ newPassword: '', confirmPassword: '' })
    setShowPasswordModal(true)
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      CLINIC_ADMIN: { label: 'Admin Clínica', color: 'bg-blue-100 text-blue-800' },
      DENTIST: { label: 'Dentista', color: 'bg-green-100 text-green-800' },
      RECEPTIONIST: { label: 'Recepcionista', color: 'bg-purple-100 text-purple-800' },
    }
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600">Administra usuarios de todas las clínicas dentales</p>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard/super-admin'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Selector de Clínica */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Clínica</h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                disabled={loading}
              >
                <option value="">Selecciona una clínica...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              
              {selectedOrgId && (
                <button
                  onClick={() => setShowNewUserModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  disabled={loading}
                >
                  + Nuevo Usuario
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Usuarios */}
        {userManagementData && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Usuarios de {userManagementData.organization.name}
                </h2>
                <div className="text-sm text-gray-600">
                  Total: {userManagementData.total} usuarios
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userManagementData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="text-yellow-600 hover:text-yellow-800 font-medium"
                          disabled={loading}
                        >
                          Cambiar Contraseña
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {userManagementData.users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay usuarios en esta clínica
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedOrgId && (
          <div className="text-center py-12 text-gray-500">
            Selecciona una clínica para ver sus usuarios
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Cargando...</div>
          </div>
        )}

        {/* Modal Nuevo Usuario */}
        {showNewUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    >
                      <option value="DENTIST">Dentista</option>
                      <option value="RECEPTIONIST">Recepcionista</option>
                      <option value="CLINIC_ADMIN">Admin Clínica</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewUserModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={loading}
                  >
                    Crear Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Usuario */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Editar Usuario: {selectedUser.name}
              </h3>
              <form onSubmit={handleEditUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      value={editUserForm.role}
                      onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    >
                      <option value="DENTIST">Dentista</option>
                      <option value="RECEPTIONIST">Recepcionista</option>
                      <option value="CLINIC_ADMIN">Admin Clínica</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={loading}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cambiar Contraseña */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cambiar Contraseña: {selectedUser.name}
              </h3>
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white font-medium"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    disabled={loading}
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}