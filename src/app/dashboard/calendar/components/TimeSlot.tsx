import { CalendarAppointment } from '../hooks/useCalendarData'
import AppointmentCard from './AppointmentCard'
import { useDroppable } from '@dnd-kit/core'
import { format } from 'date-fns'
import clsx from 'clsx'

interface TimeSlotProps {
  time: string
  appointments: CalendarAppointment[]
  dentistId?: string
  date: Date
  isAvailable: boolean
  onSlotClick?: (time: string, dentistId?: string, date?: Date) => void
  onAppointmentClick?: (appointment: CalendarAppointment) => void
  onAppointmentDoubleClick?: (appointment: CalendarAppointment) => void
  className?: string
}

export default function TimeSlot({
  time,
  appointments,
  dentistId,
  date,
  isAvailable,
  onSlotClick,
  onAppointmentClick,
  onAppointmentDoubleClick,
  className
}: TimeSlotProps) {
  const hasAppointments = appointments.length > 0
  
  // Create unique drop ID for this slot
  const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  const dropId = `slot-${time}-${dentistId || 'all'}-${dateStr}`
  
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: dropId
  })
  
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'relative min-h-[60px] border border-gray-200 transition-all duration-200 w-full max-w-full overflow-hidden',
        isAvailable && 'hover:bg-blue-50 cursor-pointer',
        !isAvailable && hasAppointments && 'bg-gray-50',
        isOver && isAvailable && 'bg-blue-100 border-blue-300 border-2',
        className
      )}
      onClick={() => {
        if (isAvailable && onSlotClick) {
          onSlotClick(time, dentistId, date)
        }
      }}
    >

      {/* Available slot indicator */}
      {isAvailable && !hasAppointments && (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-300 hover:text-blue-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
      )}

      {/* Appointments */}
      <div className="p-1 space-y-1 overflow-hidden">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onClick={onAppointmentClick}
            onDoubleClick={onAppointmentDoubleClick}
            className="w-full max-w-full"
          />
        ))}
      </div>

      {/* Slot overlay for drag and drop */}
      <div className="absolute inset-0 pointer-events-none">
        {isAvailable && (
          <div className="w-full h-full border-2 border-dashed border-transparent hover:border-blue-300 transition-colors pointer-events-none" />
        )}
      </div>
    </div>
  )
}