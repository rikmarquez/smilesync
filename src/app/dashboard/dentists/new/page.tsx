'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function NewDentist() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'DENTIST'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      setError('Nombre y email son requeridos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/dentists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role
        })
      })

      if (response.ok) {
        router.push('/dashboard/dentists')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al crear dentista')
      }
    } catch (err) {
      setError('Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Cargando...</div>
  }

  // Solo admins pueden crear dentistas
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Acceso Denegado</h3>
          <p className="text-red-700 mt-1">Solo los administradores pueden crear dentistas.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Dentista</h1>
          <p className="text-gray-600">Registrar un nuevo dentista en el sistema</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Ej. Dr. Juan Pérez García"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="doctor@ejemplo.com"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Este email se usará para acceder al sistema
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="+525512345678"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Incluir código de país (ej. +52 para México)
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white [&>option]:text-gray-900 [&>option]:bg-white"
                  required
                >
                  <option value="DENTIST">Dentista</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="RECEPTIONIST">Recepcionista</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Define los permisos y acceso en el sistema
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Dentista'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">🦷 Dentista</h3>
            <p className="text-sm text-blue-700">
              Puede ver y gestionar sus propias citas y pacientes
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">👑 Administrador</h3>
            <p className="text-sm text-green-700">
              Acceso completo: gestionar dentistas, citas, pacientes y configuración
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-purple-800 mb-2">📋 Recepcionista</h3>
            <p className="text-sm text-purple-700">
              Puede gestionar citas y pacientes, sin acceso a configuración
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">💡 Importante</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• El nuevo usuario recibirá un email de activación en el futuro</li>
            <li>• Por ahora puede acceder directamente con su email</li>
            <li>• Asegúrate de que el email sea correcto y accesible</li>
          </ul>
        </div>
      </div>
    </div>
  )
}