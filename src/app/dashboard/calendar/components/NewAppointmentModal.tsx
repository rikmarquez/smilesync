'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

interface NewAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (appointmentData: any) => void
  prefilledData?: {
    time: string
    dentistId?: string
    date?: Date
  }
  dentists: Array<{ id: string; name: string }>
}

export default function NewAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledData,
  dentists
}: NewAppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    serviceId: '',
    dentistId: prefilledData?.dentistId || '',
    date: prefilledData?.date ? format(prefilledData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: prefilledData?.time || '09:00',
    duration: 30,
    notes: ''
  })

  const [services] = useState([
    { id: '1', name: 'Consulta General', duration: 30 },
    { id: '2', name: 'Limpieza Dental', duration: 45 },
    { id: '3', name: 'Empaste', duration: 60 },
    { id: '4', name: 'Endodoncia', duration: 90 },
    { id: '5', name: 'Extracción', duration: 30 },
    { id: '6', name: 'Ortodoncia', duration: 45 },
    { id: '7', name: 'Blanqueamiento', duration: 120 }
  ])

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && prefilledData) {
      setFormData(prev => ({
        ...prev,
        time: prefilledData.time || '09:00',
        dentistId: prefilledData.dentistId || '',
        date: prefilledData.date ? format(prefilledData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      }))
    }
  }, [isOpen, prefilledData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create appointment data
      const appointmentData = {
        ...formData,
        startTime: `${formData.date}T${formData.time}:00`,
        duration: services.find(s => s.id === formData.serviceId)?.duration || 30
      }

      await onSubmit(appointmentData)
      onClose()
      
      // Reset form
      setFormData({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        serviceId: '',
        dentistId: prefilledData?.dentistId || '',
        date: prefilledData?.date ? format(prefilledData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        time: prefilledData?.time || '09:00',
        duration: 30,
        notes: ''
      })
    } catch (error) {
      console.error('Error creating appointment:', error)
      // Handle error - you could show a toast notification here
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            📅 Nueva Cita
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Información del Paciente</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del paciente"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.patientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-gray-900">Detalles de la Cita</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio *
                </label>
                <select
                  required
                  value={formData.serviceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar servicio</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar dentista</option>
                  {dentists.map((dentist) => (
                    <option key={dentist.id} value={dentist.id}>
                      {dentist.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional, alergias, etc."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
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
              {loading ? 'Creando...' : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}