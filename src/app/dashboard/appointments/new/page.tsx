'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
}

interface Service {
  id: string
  name: string
  duration: number
  price?: number
}

interface User {
  id: string
  name: string
  role: string
}

export default function NewAppointment() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [dentists, setDentists] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    patientId: '',
    dentistId: '',
    serviceId: '',
    date: '',
    time: '',
    duration: 30,
    notes: ''
  })
  
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    duration: 30,
    price: ''
  })
  const [creatingService, setCreatingService] = useState(false)

  useEffect(() => {
    if (!session) return

    // Fetch data
    Promise.all([
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/services').then(r => r.json()),
      fetch('/api/users?role=DENTIST,ADMIN').then(r => r.json())
    ]).then(([patientsData, servicesData, usersData]) => {
      setPatients(patientsData)
      setServices(servicesData || [])
      setDentists(usersData || [])
    }).catch(err => {
      console.error('Error fetching data:', err)
    })
  }, [session])

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    setFormData(prev => ({
      ...prev,
      serviceId,
      duration: service?.duration || 30
    }))
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceData.name) return

    setCreatingService(true)
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServiceData.name,
          duration: newServiceData.duration,
          price: newServiceData.price ? parseFloat(newServiceData.price) : null
        })
      })

      if (response.ok) {
        const newService = await response.json()
        setServices(prev => [...prev, newService])
        setFormData(prev => ({
          ...prev,
          serviceId: newService.id,
          duration: newService.duration
        }))
        setShowNewServiceModal(false)
        setNewServiceData({ name: '', duration: 30, price: '' })
      } else {
        const data = await response.json()
        setError(data.error || 'Error al crear servicio')
      }
    } catch (err) {
      setError('Error al crear servicio')
    } finally {
      setCreatingService(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.patientId || !formData.dentistId || !formData.date || !formData.time) {
      setError('Por favor llena todos los campos requeridos')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Validar y construir la fecha de manera más robusta
      const dateTimeString = `${formData.date}T${formData.time}:00`
      const startTime = new Date(dateTimeString)
      
      // Verificar si la fecha es válida
      if (isNaN(startTime.getTime())) {
        setError('Fecha u hora inválida. Por favor verifica los valores.')
        setLoading(false)
        return
      }
      
      // Verificar que la fecha no sea en el pasado
      const now = new Date()
      if (startTime < now) {
        setError('La fecha y hora de la cita no puede ser en el pasado.')
        setLoading(false)
        return
      }
      
      // Verificar que esté dentro del horario laboral (8:00 AM - 8:00 PM)
      const hour = startTime.getHours()
      if (hour < 8 || hour >= 20) {
        setError('La hora debe estar entre las 8:00 AM y las 8:00 PM.')
        setLoading(false)
        return
      }
      
      const endTime = new Date(startTime.getTime() + formData.duration * 60000)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          dentistId: formData.dentistId,
          serviceId: formData.serviceId || null,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: formData.notes || null
        })
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        let data = null
        try {
          const text = await response.text()
          if (text) {
            data = JSON.parse(text)
          }
        } catch (jsonError) {
          console.error('Error parsing response JSON:', jsonError)
        }
        
        if (response.status === 409) {
          setError('Ya existe una cita en ese horario para el dentista seleccionado.')
        } else if (response.status === 400) {
          setError(data?.error || 'Los datos de la cita no son válidos.')
        } else if (response.status >= 500) {
          setError('Error del servidor. Por favor inténtalo más tarde.')
        } else {
          setError(data?.error || `Error ${response.status}: No se pudo crear la cita.`)
        }
      }
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError('Error de conexión. Por favor verifica tu conexión a internet.')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nueva Cita</h1>
          <p className="text-gray-600">Programa una nueva cita para un paciente</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Patient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white [&>option]:text-gray-900 [&>option]:bg-white"
                  required
                >
                  <option value="">Seleccionar paciente</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dentist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dentista *
                </label>
                <select
                  value={formData.dentistId}
                  onChange={(e) => setFormData(prev => ({ ...prev, dentistId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white [&>option]:text-gray-900 [&>option]:bg-white"
                  required
                >
                  <option value="">Seleccionar dentista</option>
                  {dentists.map(dentist => (
                    <option key={dentist.id} value={dentist.id}>
                      {dentist.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Servicio
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewServiceModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    + Crear nuevo
                  </button>
                </div>
                <select
                  value={formData.serviceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white [&>option]:text-gray-900 [&>option]:bg-white"
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.duration}min
                      {service.price && ` - $${service.price}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                  min="15"
                  max="180"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  min="08:00"
                  max="20:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Horario de atención: 8:00 AM - 8:00 PM
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="Notas adicionales sobre la cita..."
              />
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
                {loading ? 'Creando...' : 'Crear Cita'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Service Modal */}
      {showNewServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Servicio</h3>
              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    value={newServiceData.name}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Ej: Limpieza dental"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="480"
                    step="5"
                    value={newServiceData.duration}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newServiceData.price}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Opcional"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewServiceModal(false)
                      setNewServiceData({ name: '', duration: 30, price: '' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingService}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {creatingService ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}