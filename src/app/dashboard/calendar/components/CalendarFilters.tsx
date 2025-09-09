import { Dentist } from '../hooks/useCalendarData'
import clsx from 'clsx'
import { useState, useRef } from 'react'
import { format } from 'date-fns'

interface CalendarFiltersProps {
  dentists: Dentist[]
  selectedDentist: string
  onDentistChange: (dentistId: string) => void
  view: 'day' | 'week' | 'month'
  onViewChange: (view: 'day' | 'week' | 'month') => void
  currentDate: string
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onDateChange?: (date: Date) => void
}

const viewLabels = {
  day: 'Día',
  week: 'Semana', 
  month: 'Mes'
}

export default function CalendarFilters({
  dentists,
  selectedDentist,
  onDentistChange,
  view,
  onViewChange,
  currentDate,
  onPrevious,
  onNext,
  onToday,
  onDateChange
}: CalendarFiltersProps) {
  // Initialize with persisted date or today's date
  const getInitialDate = () => {
    try {
      const saved = localStorage.getItem('calendar-goto-date')
      return saved || format(new Date(), 'yyyy-MM-dd')
    } catch {
      return format(new Date(), 'yyyy-MM-dd')
    }
  }
  
  const [dateInputValue, setDateInputValue] = useState(getInitialDate)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const handleViewNavigation = (targetView: 'day' | 'week' | 'month', direction: 'prev' | 'next') => {
    if (view !== targetView) {
      onViewChange(targetView)
    }
    if (direction === 'prev') {
      onPrevious()
    } else {
      onNext()
    }
    // Don't change the input - keep the user's date
  }

  const handleTodayClick = () => {
    onToday()
    // Don't change the input - keep the user's date
  }

  const handlePreviousClick = () => {
    onPrevious()
    // Don't change the input - keep the user's date
  }

  const handleNextClick = () => {
    onNext()
    // Don't change the input - keep the user's date
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDateInputValue(value)
    // Persist the date in localStorage
    try {
      localStorage.setItem('calendar-goto-date', value)
    } catch {
      // Ignore localStorage errors
    }
    // Don't navigate immediately, wait for button click or Enter key
  }

  const handleGoToDate = () => {
    if (dateInputValue && onDateChange) {
      const [year, month, day] = dateInputValue.split('-').map(Number)
      if (year && month && day) {
        const localDate = new Date(year, month - 1, day)
        onDateChange(localDate)
        // DON'T update the input - keep the user's selected date visible
      }
    }
  }

  const handleDateKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToDate()
    }
  }

  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* Main navigation controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Current Date Display */}
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentDate}
          </h2>
          
          <button
            onClick={handleTodayClick}
            className="px-3 py-1 text-sm font-medium border border-gray-400 rounded-md hover:bg-gray-100 transition-colors text-gray-900 bg-white"
          >
            Hoy
          </button>
          
          {/* Date Picker for quick navigation */}
          {onDateChange && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Ir a:
              </label>
              <div className="flex items-center space-x-1">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateInputValue}
                  onChange={handleDateInputChange}
                  onKeyPress={handleDateKeyPress}
                  className="px-3 py-1 text-sm font-medium border border-gray-400 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  title="Seleccionar fecha y presiona Enter o click en Ir"
                />
                <button
                  onClick={handleGoToDate}
                  className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  title="Ir a la fecha seleccionada"
                >
                  Ir
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Dentist Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            Dentista:
          </label>
          <select
            value={selectedDentist}
            onChange={(e) => onDentistChange(e.target.value)}
            className="px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm min-w-[180px] [&>option]:text-gray-900 [&>option]:bg-white font-medium"
          >
            {view === 'day' && (
              <option value="all">
                Todos los dentistas
              </option>
            )}
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* View Navigation with Previous/Next */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        {/* Previous Navigation Button */}
        <button
          onClick={handlePreviousClick}
          className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-sm border-2 border-green-700"
          title={view === 'day' ? 'Día anterior' : view === 'week' ? 'Semana anterior' : 'Mes anterior'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* View Selector */}
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          {(['day', 'week', 'month'] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => onViewChange(viewType)}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                view === viewType
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {viewLabels[viewType]}
            </button>
          ))}
        </div>
        
        {/* Next Navigation Button */}
        <button
          onClick={handleNextClick}
          className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-sm border-2 border-green-700"
          title={view === 'day' ? 'Día siguiente' : view === 'week' ? 'Semana siguiente' : 'Mes siguiente'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}