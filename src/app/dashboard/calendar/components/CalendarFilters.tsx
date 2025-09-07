import { Dentist } from '../hooks/useCalendarData'
import clsx from 'clsx'

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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Date Navigation */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevious}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
            {currentDate}
          </h2>
          
          <button
            onClick={onNext}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Siguiente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={onToday}
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
            <input
              type="date"
              onChange={(e) => {
                // Fix timezone issue by creating date in local timezone
                const [year, month, day] = e.target.value.split('-').map(Number)
                const localDate = new Date(year, month - 1, day) // month is 0-based
                onDateChange(localDate)
              }}
              className="px-3 py-1 text-sm font-medium border border-gray-400 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              title="Seleccionar fecha"
            />
          </div>
        )}
        
        {/* Quick navigation buttons */}
        <div className="flex items-center space-x-1 border-l border-gray-300 pl-4">
          <button
            onClick={() => {
              const today = new Date()
              const targetDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
              onDateChange?.(targetDate)
            }}
            className="px-2 py-1 text-xs font-medium border border-gray-400 rounded hover:bg-gray-100 transition-colors text-red-700 hover:bg-red-50 bg-white"
            title="Hace un mes"
          >
            -1mes
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
              onDateChange?.(targetDate)
            }}
            className="px-2 py-1 text-xs font-medium border border-gray-400 rounded hover:bg-gray-100 transition-colors text-red-700 hover:bg-red-50 bg-white"
            title="Semana pasada"
          >
            -1sem
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
              onDateChange?.(targetDate)
            }}
            className="px-2 py-1 text-xs font-medium border border-gray-400 rounded hover:bg-gray-100 transition-colors text-green-700 hover:bg-green-50 bg-white"
            title="Próxima semana"
          >
            +1sem
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
              onDateChange?.(targetDate)
            }}
            className="px-2 py-1 text-xs font-medium border border-gray-400 rounded hover:bg-gray-100 transition-colors text-green-700 hover:bg-green-50 bg-white"
            title="En un mes"
          >
            +1mes
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* View Toggle */}
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          {(['day', 'week', 'month'] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => onViewChange(viewType)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors',
                view === viewType
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {viewLabels[viewType]}
            </button>
          ))}
        </div>

        {/* Dentist Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            Dentista:
          </label>
          <select
            value={selectedDentist === 'all' ? (dentists[0]?.id || '') : selectedDentist}
            onChange={(e) => onDentistChange(e.target.value)}
            className="px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm min-w-[150px] [&>option]:text-gray-900 [&>option]:bg-white font-medium"
          >
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}