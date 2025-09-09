'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'
import { CalendarAppointment } from '../hooks/useCalendarData'

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  birthDate?: string
}

interface EditAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (appointmentData: any) => void
  onDelete: (appointmentId: string) => void
  appointment: CalendarAppointment | null
  dentists: Array<{ id: string; name: string }>
}

export default function EditAppointmentModal({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  appointment,
  dentists
}: EditAppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    serviceId: '',
    dentistId: '',
    date: '',
    time: '',
    duration: 30,
    notes: '',
    status: 'SCHEDULED'
  })

  const [services, setServices] = useState<Array<{id: string, name: string, duration: number}>>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services')
        if (response.ok) {
          const data = await response.json()
          setServices(data)
        }
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }
    
    if (isOpen) {
      fetchServices()
    }
  }, [isOpen])

  // Populate form with appointment data
  useEffect(() => {
    if (appointment && isOpen) {
      const startDate = new Date(appointment.start)
      setFormData({
        patientId: appointment.patient.id,
        serviceId: appointment.service?.id || '',
        dentistId: appointment.dentist.id,
        date: format(startDate, 'yyyy-MM-dd'),
        time: format(startDate, 'HH:mm'),
        duration: appointment.duration,
        notes: appointment.notes || '',
        status: appointment.status
      })
    }
  }, [appointment, isOpen])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return

    setLoading(true)

    try {
      // Create new start and end times
      const startTime = new Date(`${formData.date}T${formData.time}:00`)
      const endTime = new Date(startTime.getTime() + formData.duration * 60000)

      const appointmentData = {
        dentistId: formData.dentistId,
        serviceId: formData.serviceId || null,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: formData.notes || null,
        status: formData.status
      }

      await onUpdate({ ...appointmentData, id: appointment.id })
      onClose()
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Error al actualizar la cita')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!appointment) return
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      return
    }

    setDeleting(true)
    try {
      await onDelete(appointment.id)
      onClose()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Error al eliminar la cita')
    } finally {
      setDeleting(false)
    }
  }

  // Handle service change
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    setFormData(prev => ({
      ...prev,
      serviceId,
      duration: service?.duration || 30
    }))
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            ✏️ Editar Cita
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Info (Read-only) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">👤 Paciente</h3>
            <div className="text-sm text-gray-700">
              <div><strong>{appointment.patient.name}</strong></div>
              <div>📱 {appointment.patient.phone}</div>
              {appointment.patient.email && <div>✉️ {appointment.patient.email}</div>}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora *
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicio
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">Sin servicio específico</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration} min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dentista *
              </label>
              <select
                required
                value={formData.dentistId}
                onChange={(e) => setFormData(prev => ({ ...prev, dentistId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">Seleccionar dentista</option>
                {dentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (minutos)
              </label>
              <input
                type="number"
                min="15"
                max="180"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="SCHEDULED">📅 Programada</option>
                <option value="CONFIRMED">✅ Confirmada</option>
                <option value="COMPLETED">🏆 Completada</option>
                <option value="CANCELLED">❌ Cancelada</option>
                <option value="NO_SHOW">👻 No se presentó</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Notas adicionales sobre la cita..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={clsx(
                'px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                deleting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              )}
            >
              {deleting ? 'Eliminando...' : '🗑️ Eliminar'}
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}