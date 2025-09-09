'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  birthDate?: string
}

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
  // Form data state
  const [formData, setFormData] = useState({
    patientId: '',
    serviceId: '',
    dentistId: prefilledData?.dentistId || '',
    date: prefilledData?.date ? format(prefilledData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: prefilledData?.time || '09:00',
    duration: 30,
    notes: ''
  })

  // Patient search and selection
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // New patient creation
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    phone: '',
    birthDate: ''
  })

  const [services, setServices] = useState<Array<{id: string, name: string, duration: number}>>([])
  
  // New service creation
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    duration: 30,
    price: ''
  })
  const [creatingService, setCreatingService] = useState(false)
  
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
    
    fetchServices()
  }, [])

  const [loading, setLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Search patients
  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const patients = await response.json()
        setSearchResults(patients)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const debouncer = setTimeout(() => {
      if (searchQuery && !selectedPatient) {
        searchPatients(searchQuery)
      }
    }, 300)

    return () => clearTimeout(debouncer)
  }, [searchQuery, selectedPatient])

  // Reset form when modal opens
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

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData(prev => ({ ...prev, patientId: patient.id }))
    setSearchQuery(`${patient.name} - ${patient.phone}`)
    setShowResults(false)
    setShowNewPatientForm(false)
  }

  // Clear patient selection
  const clearPatientSelection = () => {
    setSelectedPatient(null)
    setFormData(prev => ({ ...prev, patientId: '' }))
    setSearchQuery('')
    setShowResults(false)
    setShowNewPatientForm(false)
  }

  // Create new patient
  const handleCreateNewPatient = async () => {
    try {
      console.log('Creating patient with data:', newPatientData)
      
      // Add empty email to match API expectations
      const patientDataWithEmail = {
        ...newPatientData,
        email: ''
      }
      
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientDataWithEmail),
      })

      const responseData = await response.json()
      console.log('Response:', { status: response.status, data: responseData })

      if (response.ok) {
        handlePatientSelect(responseData)
        // Reset new patient form
        setNewPatientData({
          name: '',
          phone: '',
          birthDate: ''
        })
      } else {
        console.error('Error response from API:', responseData)
        if (responseData.details) {
          console.error('Validation details:', responseData.details)
        }
        alert(responseData.error || 'Error al crear paciente')
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      alert('Error al crear paciente')
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPatient && !showNewPatientForm) {
      alert('Por favor selecciona un paciente o crea uno nuevo')
      return
    }

    setLoading(true)

    try {
      let patientId = formData.patientId

      // Create new patient if needed
      if (showNewPatientForm && !selectedPatient) {
        const patientDataWithEmail = {
          ...newPatientData,
          email: ''
        }
        
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patientDataWithEmail),
        })

        const responseData = await response.json()

        if (response.ok) {
          patientId = responseData.id
        } else {
          console.error('Error creating patient:', responseData)
          alert(responseData.error || 'Error al crear paciente')
          return
        }
      }

      // Create appointment
      const appointmentData = {
        ...formData,
        patientId,
        startTime: `${formData.date}T${formData.time}:00`,
        duration: services.find(s => s.id === formData.serviceId)?.duration || 30
      }

      console.log('Creating appointment with data:', appointmentData)
      await onSubmit(appointmentData)
      onClose()
      
      // Reset form
      resetForm()
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al crear la cita')
    } finally {
      setLoading(false)
    }
  }

  // Handle service creation
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
        setNewServiceData({
          name: '',
          duration: 30,
          price: ''
        })
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Error al crear servicio')
      }
    } catch (error) {
      console.error('Error creating service:', error)
      alert('Error al crear servicio')
    } finally {
      setCreatingService(false)
    }
  }

  const resetForm = () => {
    setFormData({
      patientId: '',
      serviceId: '',
      dentistId: prefilledData?.dentistId || '',
      date: prefilledData?.date ? format(prefilledData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      time: prefilledData?.time || '09:00',
      duration: 30,
      notes: ''
    })
    setSelectedPatient(null)
    setSearchQuery('')
    setShowResults(false)
    setShowNewPatientForm(false)
    setNewPatientData({
      name: '',
      phone: '',
      birthDate: ''
    })
    setShowNewServiceModal(false)
    setNewServiceData({
      name: '',
      duration: 30,
      price: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[95vh] overflow-y-auto">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Search/Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Seleccionar Paciente</h3>
            
            {!selectedPatient && !showNewPatientForm && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar paciente por nombre, teléfono o email
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                  placeholder="Escribe para buscar..."
                />
                
                {/* Search Results */}
                {showResults && (
                  <div ref={resultsRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-gray-500">Buscando...</div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {searchResults.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => handlePatientSelect(patient)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                          >
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">
                              {patient.phone} {patient.email && `• ${patient.email}`}
                            </div>
                          </button>
                        ))}
                        <div className="border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewPatientForm(true)
                              setNewPatientData(prev => ({ ...prev, name: searchQuery }))
                              setShowResults(false)
                            }}
                            className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                          >
                            + Crear nuevo paciente "{searchQuery}"
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-3">
                        <div className="text-sm text-gray-500 mb-2">No se encontraron pacientes</div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewPatientForm(true)
                            setNewPatientData(prev => ({ ...prev, name: searchQuery }))
                            setShowResults(false)
                          }}
                          className="w-full text-left text-blue-600 hover:text-blue-800"
                        >
                          + Crear nuevo paciente "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selected Patient */}
            {selectedPatient && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">👤 {selectedPatient.name}</div>
                    <div className="text-sm text-gray-600">
                      📱 {selectedPatient.phone}
                      {selectedPatient.email && ` • ✉️ ${selectedPatient.email}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearPatientSelection}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* New Patient Form */}
            {showNewPatientForm && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">➕ Crear Nuevo Paciente</h4>
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPatientData.phone}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de nacimiento (opcional)
                    </label>
                    <input
                      type="date"
                      value={newPatientData.birthDate}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Save Patient Button */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-green-300">
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(false)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewPatient}
                    disabled={!newPatientData.name || !newPatientData.phone}
                    className={clsx(
                      'px-3 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
                      !newPatientData.name || !newPatientData.phone
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    )}
                  >
                    ✓ Guardar
                  </button>
                </div>
              </div>
            )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Servicio *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewServiceModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Crear servicio
                  </button>
                </div>
                <select
                  required
                  value={formData.serviceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
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
              disabled={loading || (!selectedPatient && !showNewPatientForm)}
              className={clsx(
                'px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                loading || (!selectedPatient && !showNewPatientForm)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {loading ? 'Creando...' : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal for creating new service */}
      {showNewServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Servicio</h3>
              <button
                type="button"
                onClick={() => setShowNewServiceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateService}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    value={newServiceData.name}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    placeholder="Ej. Limpieza dental"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración (minutos) *
                    </label>
                    <input
                      type="number"
                      required
                      min="15"
                      max="240"
                      value={newServiceData.duration}
                      onChange={(e) => setNewServiceData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newServiceData.price}
                      onChange={(e) => setNewServiceData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingService}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                    creatingService
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  )}
                >
                  {creatingService ? 'Creando...' : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}