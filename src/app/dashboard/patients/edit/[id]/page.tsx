'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'

interface Patient {
  id: string
  name: string
  email: string | null
  phone: string
  birthDate: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export default function EditPatient() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingPatient, setLoadingPatient] = useState(true)
  const [error, setError] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    address: ''
  })

  useEffect(() => {
    if (session && patientId) {
      fetchPatient()
    }
  }, [session, patientId])

  const fetchPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) {
        throw new Error('Paciente no encontrado')
      }
      
      const patientData = await response.json()
      setPatient(patientData)
      
      // Populate form with existing data
      setFormData({
        name: patientData.name || '',
        email: patientData.email || '',
        phone: patientData.phone || '',
        birthDate: patientData.birthDate 
          ? new Date(patientData.birthDate).toISOString().split('T')[0] 
          : '',
        address: patientData.address || ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar paciente')
    } finally {
      setLoadingPatient(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) {
      setError('Nombre y teléfono son requeridos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone,
          birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
          address: formData.address || null
        })
      })

      if (response.ok) {
        router.push('/dashboard/patients')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar paciente')
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

  if (loadingPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando paciente...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 mt-1">Paciente no encontrado</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
          <p className="text-gray-600">Modificar información de {patient.name}</p>
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
                  placeholder="Ej. Juan Pérez García"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="+525512345678"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Incluir código de país (ej. +52 para México)
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="juan.perez@email.com"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="Calle Reforma #123, Ciudad de México, México"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/dashboard/patients')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Patient Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Información del Paciente</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><span className="font-medium">ID:</span> {patient.id}</p>
            <p><span className="font-medium">Registrado:</span> {new Date(patient.createdAt || '').toLocaleDateString('es-MX')}</p>
            <p><span className="font-medium">Última actualización:</span> {new Date(patient.updatedAt || '').toLocaleDateString('es-MX')}</p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">💡 Consejos</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• El teléfono debe incluir código de país (+52) para los recordatorios por WhatsApp</li>
            <li>• El email es opcional pero ayuda para comunicación adicional</li>
            <li>• La fecha de nacimiento permite calcular la edad automáticamente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}