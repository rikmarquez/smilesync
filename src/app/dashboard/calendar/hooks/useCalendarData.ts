import { useState, useEffect, useCallback } from 'react'
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

export interface CalendarAppointment {
  id: string
  title: string
  start: string
  end: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  patient: {
    id: string
    name: string
    phone: string
    email?: string
  }
  dentist: {
    id: string
    name: string
  }
  service?: {
    id: string
    name: string
    duration: number
    price?: number
  }
  notes?: string
  duration: number
}

export interface Dentist {
  id: string
  name: string
}

export interface CalendarData {
  appointments: CalendarAppointment[]
  dentists: Dentist[]
  timeSlots: string[]
  dateRange: {
    start: string
    end: string
  }
  view: 'day' | 'week' | 'month'
}

type ViewType = 'day' | 'week' | 'month'

export function useCalendarData() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('week')
  const [selectedDentist, setSelectedDentist] = useState<string>('')

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        view,
        date: currentDate.toISOString(),
        ...(selectedDentist && selectedDentist !== 'all' && { dentistId: selectedDentist })
      })

      const response = await fetch(`/api/appointments/calendar?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data')
      }

      const calendarData = await response.json()
      
      // Debug: log appointments data
      console.log('DEBUG - Calendar appointments received:', {
        count: calendarData.appointments?.length || 0,
        appointments: calendarData.appointments?.map((apt: any) => ({
          id: apt.id,
          start: apt.start,
          patient: apt.patient?.name,
          dentist: apt.dentist?.name,
          time: format(new Date(apt.start), 'HH:mm')
        })) || []
      })
      
      setData(calendarData)
      
      // Auto-select first dentist if none selected
      if (!selectedDentist && calendarData.dentists.length > 0) {
        setSelectedDentist(calendarData.dentists[0].id)
      }
    } catch (err) {
      console.error('Calendar data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [currentDate, view, selectedDentist])

  // Initial load and refetch on dependencies change
  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  // Navigation functions
  const navigatePrevious = useCallback(() => {
    setCurrentDate(prevDate => {
      switch (view) {
        case 'day':
          return subDays(prevDate, 1)
        case 'month':
          return subMonths(prevDate, 1)
        case 'week':
        default:
          return subWeeks(prevDate, 1)
      }
    })
  }, [view])

  const navigateNext = useCallback(() => {
    setCurrentDate(prevDate => {
      switch (view) {
        case 'day':
          return addDays(prevDate, 1)
        case 'month':
          return addMonths(prevDate, 1)
        case 'week':
        default:
          return addWeeks(prevDate, 1)
      }
    })
  }, [view])

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])


  // Format current date for display
  const formattedCurrentDate = format(currentDate, 'MMMM yyyy', { locale: es })

  // Get appointments for a specific slot
  const getAppointmentsForSlot = useCallback((time: string, dentistId?: string, date?: Date) => {
    if (!data) return []
    
    const results = data.appointments.filter(appointment => {
      const appointmentStart = new Date(appointment.start)
      
      // Convert to local timezone for comparison
      const appointmentTimeLocal = format(appointmentStart, 'HH:mm')
      const appointmentDateLocal = format(appointmentStart, 'yyyy-MM-dd')
      
      const matchesTime = appointmentTimeLocal === time
      const matchesDentist = !dentistId || appointment.dentist.id === dentistId
      const matchesDate = !date || format(date, 'yyyy-MM-dd') === appointmentDateLocal
      
      // Debug logging for appointments that should appear
      if (time === '09:00' && appointmentStart.toISOString().includes('2025-09-08')) {
        console.log('DEBUG - 9:00 slot check for Sept 8:', {
          appointmentId: appointment.id,
          appointmentStartUTC: appointment.start,
          appointmentStartLocal: appointmentStart.toString(),
          appointmentTimeLocal,
          appointmentDateLocal,
          requestedTime: time,
          requestedDate: date ? format(date, 'yyyy-MM-dd') : 'any',
          patientName: appointment.patient.name,
          dentistName: appointment.dentist.name,
          matchesTime,
          matchesDentist,
          matchesDate,
          finalMatch: matchesTime && matchesDentist && matchesDate
        })
      }
      
      return matchesTime && matchesDentist && matchesDate
    })
    
    return results
  }, [data])

  // Check if a slot is available
  const isSlotAvailable = useCallback((time: string, dentistId: string, date?: Date) => {
    if (!data) return true
    
    // Convert slot time to a proper time for comparison
    const [hours, minutes] = time.split(':').map(Number)
    const slotDate = date || currentDate
    const slotStart = new Date(slotDate)
    slotStart.setHours(hours, minutes, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000) // 30 minutes later
    
    // Check if any appointment conflicts with this slot
    const hasConflict = data.appointments.some(appointment => {
      if (appointment.dentist.id !== dentistId) return false
      
      const appointmentStart = new Date(appointment.start)
      const appointmentEnd = new Date(appointment.end)
      
      // Check if appointment date matches slot date
      const appointmentDate = format(appointmentStart, 'yyyy-MM-dd')
      const slotDateString = format(slotDate, 'yyyy-MM-dd')
      if (appointmentDate !== slotDateString) return false
      
      // Check for time overlap: appointment overlaps if it starts before slot ends and ends after slot starts
      const overlaps = appointmentStart < slotEnd && appointmentEnd > slotStart
      
      // Debug logging for 9:30 slot on Sept 8
      if (time === '09:30' && appointmentDate === '2025-09-08') {
        console.log('DEBUG - 9:30 slot availability check:', {
          time,
          slotStart: slotStart.toISOString(),
          slotEnd: slotEnd.toISOString(),
          appointmentId: appointment.id,
          appointmentStart: appointmentStart.toISOString(),
          appointmentEnd: appointmentEnd.toISOString(),
          patientName: appointment.patient.name,
          overlaps
        })
      }
      
      return overlaps
    })
    
    return !hasConflict
  }, [data, currentDate])

  return {
    // Data
    data,
    loading,
    error,
    
    // State
    currentDate,
    view,
    selectedDentist,
    formattedCurrentDate,
    
    // Actions
    setView,
    setSelectedDentist,
    navigatePrevious,
    navigateNext,
    navigateToday,
    navigateToDate,
    refetch: fetchCalendarData,
    
    // Utilities
    getAppointmentsForSlot,
    isSlotAvailable
  }
}