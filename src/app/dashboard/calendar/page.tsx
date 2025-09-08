'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { useCalendarData, CalendarAppointment } from './hooks/useCalendarData'
import CalendarFilters from './components/CalendarFilters'
import CalendarGrid from './components/CalendarGrid'
import AppointmentCard from './components/AppointmentCard'
import NewAppointmentModal from './components/NewAppointmentModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

export default function CalendarPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Calendar data and state
  const {
    data,
    loading,
    error,
    currentDate,
    view,
    selectedDentist,
    formattedCurrentDate,
    setView,
    setSelectedDentist,
    navigatePrevious,
    navigateNext,
    navigateToday,
    navigateToDate,
    moveAppointment,
    getAppointmentsForSlot,
    isSlotAvailable
  } = useCalendarData()

  // Drag and drop state
  const [activeAppointment, setActiveAppointment] = useState<CalendarAppointment | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Modal state for creating appointments
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{
    time: string
    dentistId?: string
    date?: Date
  } | null>(null)

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const appointmentId = event.active.id as string
    const appointment = data?.appointments.find(apt => apt.id === appointmentId)
    
    if (appointment) {
      setActiveAppointment(appointment)
      setIsDragging(true)
    }
  }

  // Handle drag end (reagendar functionality)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveAppointment(null)
    setIsDragging(false)

    if (!over || !active || !data) return

    const appointmentId = active.id as string
    const dropTarget = over.id as string

    try {
      // Parse drop target: format "slot-time-dentistId-date"
      const [, time, dentistId, dateStr] = dropTarget.split('-')
      
      if (!time) return

      const targetDate = dateStr ? new Date(dateStr) : currentDate
      
      // Create new start time
      const [hours, minutes] = time.split(':').map(Number)
      const newStartTime = new Date(targetDate)
      newStartTime.setHours(hours, minutes, 0, 0)

      await moveAppointment(appointmentId, newStartTime.toISOString(), dentistId)
      
    } catch (error) {
      console.error('Error moving appointment:', error)
      // You could show a toast notification here
    }
  }

  // Handle slot click (create new appointment)
  const handleSlotClick = (time: string, dentistId?: string, date?: Date) => {
    setSelectedSlot({ time, dentistId, date })
    setShowNewAppointmentModal(true)
  }

  // Handle new appointment creation
  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      console.log('Sending appointment data to API:', appointmentData)
      
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      })

      const responseData = await response.json()
      console.log('API response:', { status: response.status, data: responseData })

      if (!response.ok) {
        if (responseData.details) {
          console.error('Validation details:', responseData.details)
        }
        throw new Error(responseData.error || 'Failed to create appointment')
      }
      
      // Refresh calendar data to show new appointment
      window.location.reload() // Simple refresh for now
      
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al crear la cita: ' + (error as Error).message)
    }
  }

  // Handle appointment click (view details)
  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    // Navigate to appointment details or show modal
    console.log('Appointment clicked:', appointment)
  }

  // Handle appointment double click (edit)
  const handleAppointmentDoubleClick = (appointment: CalendarAppointment) => {
    // Navigate to edit appointment
    router.push(`/dashboard/appointments/${appointment.id}/edit`)
  }

  if (!session) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">Error al cargar el calendario</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Temporary debug log
  console.log('DEBUG - Calendar page data:', {
    appointmentsCount: data.appointments.length,
    appointments: data.appointments.map(apt => ({
      id: apt.id,
      start: apt.start,
      patient: apt.patient.name,
      dentist: apt.dentist.name
    }))
  })

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  📅 Calendario de Citas
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/appointments/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Nueva Cita
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          {/* Calendar Controls */}
          <CalendarFilters
            dentists={data.dentists}
            selectedDentist={selectedDentist}
            onDentistChange={setSelectedDentist}
            view={view}
            onViewChange={setView}
            currentDate={formattedCurrentDate}
            onPrevious={navigatePrevious}
            onNext={navigateNext}
            onToday={navigateToday}
            onDateChange={navigateToDate}
          />

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <CalendarGrid
              appointments={data.appointments}
              dentists={data.dentists}
              timeSlots={data.timeSlots}
              selectedDentist={selectedDentist}
              view={view}
              currentDate={currentDate}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
              onAppointmentDoubleClick={handleAppointmentDoubleClick}
              getAppointmentsForSlot={getAppointmentsForSlot}
              isSlotAvailable={isSlotAvailable}
            />
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📅</span>
                    </div>
                  </div>
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500">Total Citas</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {data.appointments.length}
                      </dd>
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
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500">Confirmadas</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {data.appointments.filter(apt => apt.status === 'CONFIRMED').length}
                      </dd>
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
                      <span className="text-white text-sm">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500">Pendientes</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {data.appointments.filter(apt => apt.status === 'SCHEDULED').length}
                      </dd>
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
                      <span className="text-white text-sm">👨‍⚕️</span>
                    </div>
                  </div>
                  <div className="ml-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500">Dentistas</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {data.dentists.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Drag overlay */}
        <DragOverlay>
          {activeAppointment && (
            <AppointmentCard
              appointment={activeAppointment}
              isDragging={true}
              className="transform rotate-3 scale-105"
            />
          )}
        </DragOverlay>

        {/* New Appointment Modal */}
        <NewAppointmentModal
          isOpen={showNewAppointmentModal}
          onClose={() => setShowNewAppointmentModal(false)}
          onSubmit={handleCreateAppointment}
          prefilledData={selectedSlot}
          dentists={data.dentists}
        />
      </div>
    </DndContext>
  )
}