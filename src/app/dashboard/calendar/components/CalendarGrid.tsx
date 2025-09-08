import { CalendarAppointment, Dentist } from '../hooks/useCalendarData'
import TimeSlot from './TimeSlot'
import { format, isSameDay, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

interface CalendarGridProps {
  appointments: CalendarAppointment[]
  dentists: Dentist[]
  timeSlots: string[]
  selectedDentist: string
  view: 'day' | 'week' | 'month'
  currentDate: Date
  onSlotClick?: (time: string, dentistId?: string, date?: Date) => void
  onAppointmentClick?: (appointment: CalendarAppointment) => void
  onAppointmentDoubleClick?: (appointment: CalendarAppointment) => void
  getAppointmentsForSlot: (time: string, dentistId?: string, date?: Date) => CalendarAppointment[]
  isSlotAvailable: (time: string, dentistId: string, date?: Date) => boolean
}

export default function CalendarGrid({
  appointments,
  dentists,
  timeSlots,
  selectedDentist,
  view,
  currentDate,
  onSlotClick,
  onAppointmentClick,
  onAppointmentDoubleClick,
  getAppointmentsForSlot,
  isSlotAvailable
}: CalendarGridProps) {
  // Get selected dentist(s) - show all in day view when "all" is selected
  const displayDentists = selectedDentist === 'all' && view === 'day'
    ? dentists // Show all dentists in day view
    : selectedDentist 
      ? dentists.filter(d => d.id === selectedDentist)
      : dentists.slice(0, 1) // fallback to first dentist

  // Generate days for week view
  const weekDays = view === 'week' ? Array.from({ length: 7 }, (_, i) => {
    const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
    const date = new Date(startOfWeekDate)
    date.setDate(date.getDate() + i)
    return date
  }) : [currentDate]

  // Debug logging for week view
  if (view === 'week') {
    console.log('DEBUG - Week dates:', {
      currentDate: format(currentDate, 'yyyy-MM-dd'),
      weekDays: weekDays.map(d => format(d, 'yyyy-MM-dd EEE')),
      startOfWeek: format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd EEE')
    })
  }

  // Day view - single day
  if (view === 'day') {
    return (
      <div className="overflow-x-auto">
        {/* Header row */}
        <div className="flex">
          {/* Time column header */}
          <div className="flex-none w-16 bg-gray-50">
            <div className="h-[72px] border-b-2 border-gray-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-900">Hora</span>
            </div>
          </div>
          
          {/* Dentists header */}
          <div className="flex-1 grid gap-px bg-gray-200" style={{ 
            gridTemplateColumns: `repeat(${displayDentists.length}, 1fr)` 
          }}>
            {displayDentists.map(dentist => (
              <div key={`header-${dentist.id}`} className="bg-white p-4 font-medium text-center border-b-2 border-gray-200">
                <div className="font-semibold text-gray-900">{dentist.name}</div>
                <div className="text-sm text-gray-500">
                  {format(currentDate, 'dd MMM', { locale: es })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Time slots row */}
        <div className="flex">
          {/* Time labels column */}
          <div className="flex-none w-16 bg-gray-50">
            {timeSlots.map(time => (
              <div key={time} className="h-[60px] border-b border-gray-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-300 shadow-sm">
                  {time}
                </span>
              </div>
            ))}
          </div>
          
          {/* Appointments grid */}
          <div className="flex-1 grid gap-px bg-gray-200" style={{ 
            gridTemplateColumns: `repeat(${displayDentists.length}, 1fr)` 
          }}>
            {timeSlots.map(time => (
              displayDentists.map(dentist => {
                const slotAppointments = getAppointmentsForSlot(time, dentist.id, currentDate)
                const available = isSlotAvailable(time, dentist.id, currentDate)
                
                return (
                  <TimeSlot
                    key={`${time}-${dentist.id}`}
                    time={time}
                    appointments={slotAppointments}
                    dentistId={dentist.id}
                    date={currentDate}
                    isAvailable={available}
                    onSlotClick={onSlotClick}
                    onAppointmentClick={onAppointmentClick}
                    onAppointmentDoubleClick={onAppointmentDoubleClick}
                    className="bg-white"
                  />
                )
              })
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Week view - seven days
  if (view === 'week') {
    return (
      <div className="overflow-x-auto">
        {/* Header row */}
        <div className="flex">
          {/* Time column header */}
          <div className="flex-none w-16 bg-gray-50">
            <div className="h-[72px] border-b-2 border-gray-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-900">Hora</span>
            </div>
          </div>
          
          {/* Days header */}
          <div className="flex-1 grid gap-px bg-gray-200" style={{
            gridTemplateColumns: `repeat(${weekDays.length * displayDentists.length}, 1fr)`
          }}>
            {weekDays.map(day => 
              displayDentists.map(dentist => (
                <div key={`header-${format(day, 'yyyy-MM-dd')}-${dentist.id}`} className="bg-white p-2 text-center border-b-2 border-gray-200">
                  <div className="text-xs font-medium text-gray-600">
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {format(day, 'dd', { locale: es })}
                  </div>
                  <div className="text-xs text-gray-700">
                    {dentist.name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Time slots row */}
        <div className="flex">
          {/* Time labels column */}
          <div className="flex-none w-16 bg-gray-50">
            {timeSlots.map(time => (
              <div key={time} className="h-[60px] border-b border-gray-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-300 shadow-sm">
                  {time}
                </span>
              </div>
            ))}
          </div>

          {/* Appointments grid */}
          <div className="flex-1 grid gap-px bg-gray-200" style={{
            gridTemplateColumns: `repeat(${weekDays.length * displayDentists.length}, 1fr)`
          }}>
            {timeSlots.map(time => (
              weekDays.map(day =>
                displayDentists.map(dentist => {
                  const slotAppointments = getAppointmentsForSlot(time, dentist.id, day)
                  const available = isSlotAvailable(time, dentist.id, day)
                  
                  return (
                    <TimeSlot
                      key={`${time}-${format(day, 'yyyy-MM-dd')}-${dentist.id}`}
                      time={time}
                      appointments={slotAppointments}
                      dentistId={dentist.id}
                      date={day}
                      isAvailable={available}
                      onSlotClick={onSlotClick}
                      onAppointmentClick={onAppointmentClick}
                      onAppointmentDoubleClick={onAppointmentDoubleClick}
                      className="bg-white min-h-[60px]"
                    />
                  )
                })
              )
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Month view - simplified, showing appointments count per day
  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {/* Week days header */}
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
        <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
          {day}
        </div>
      ))}
      
      {/* Generate calendar days for current month */}
      {Array.from({ length: 35 }, (_, i) => {
        // This is a simplified month view - you'd need proper month calculation here
        const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - 6)
        const dayAppointments = appointments.filter(apt => 
          isSameDay(new Date(apt.start), day)
        )
        
        const isCurrentMonth = day.getMonth() === currentDate.getMonth()
        const isToday = isSameDay(day, new Date())
        
        return (
          <div
            key={i}
            className={clsx(
              'bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50',
              !isCurrentMonth && 'text-gray-300 bg-gray-50',
              isToday && 'bg-blue-50'
            )}
            onClick={() => onSlotClick?.('09:00', undefined, day)}
          >
            <div className={clsx(
              'text-sm font-medium mb-1',
              isToday && 'text-blue-600',
              !isToday && isCurrentMonth && 'text-gray-900',
              !isCurrentMonth && 'text-gray-300'
            )}>
              {day.getDate()}
            </div>
            
            {/* Appointment indicators */}
            <div className="space-y-1">
              {dayAppointments.slice(0, 3).map(apt => (
                <div
                  key={apt.id}
                  className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate font-medium"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAppointmentClick?.(apt)
                  }}
                >
                  {format(new Date(apt.start), 'HH:mm')} {apt.patient.name}
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <div className="text-xs text-gray-700 font-medium">
                  +{dayAppointments.length - 3} más
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}