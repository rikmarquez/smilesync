import { CalendarAppointment } from '../hooks/useCalendarData'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

interface AppointmentCardProps {
  appointment: CalendarAppointment
  onClick?: (appointment: CalendarAppointment) => void
  onDoubleClick?: (appointment: CalendarAppointment) => void
  className?: string
}

const statusColors = {
  SCHEDULED: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  CONFIRMED: 'bg-green-100 border-green-400 text-green-900',
  COMPLETED: 'bg-blue-100 border-blue-400 text-blue-900',
  CANCELLED: 'bg-red-100 border-red-400 text-red-900',
  NO_SHOW: 'bg-gray-100 border-gray-400 text-gray-900'
}

const statusLabels = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada', 
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió'
}

export default function AppointmentCard({
  appointment,
  onClick,
  onDoubleClick,
  className
}: AppointmentCardProps) {
  const startTime = format(new Date(appointment.start), 'HH:mm', { locale: es })
  const endTime = format(new Date(appointment.end), 'HH:mm', { locale: es })

  return (
    <div
      className={clsx(
        'relative rounded-md border-2 p-1 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md text-xs w-full max-w-full min-w-0 box-border',
        statusColors[appointment.status],
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(appointment)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick?.(appointment)
      }}
    >
      {/* Compact layout - Patient name (truncated) */}
      <div className="font-medium text-xs mb-1 truncate leading-tight overflow-hidden whitespace-nowrap text-ellipsis max-w-full">
        {appointment.patient.name.length > 15 
          ? `${appointment.patient.name.substring(0, 12)}...` 
          : appointment.patient.name}
      </div>

      {/* Time and service (truncated) */}
      <div className="text-xs text-gray-700 truncate leading-tight overflow-hidden whitespace-nowrap text-ellipsis max-w-full">
        {startTime} • {(appointment.service?.name || 'Consulta').length > 10
          ? `${(appointment.service?.name || 'Consulta').substring(0, 8)}...`
          : appointment.service?.name || 'Consulta'}
      </div>

      {/* Small status indicator */}
      <div className="absolute top-0 right-0 w-2 h-2 rounded-full">
        <div className={clsx(
          'w-full h-full rounded-full',
          appointment.status === 'CONFIRMED' && 'bg-green-500',
          appointment.status === 'SCHEDULED' && 'bg-yellow-500',
          appointment.status === 'COMPLETED' && 'bg-blue-500',
          appointment.status === 'CANCELLED' && 'bg-red-500',
          appointment.status === 'NO_SHOW' && 'bg-gray-500'
        )} />
      </div>

      {/* Priority indicator for urgent appointments */}
      {appointment.notes?.toLowerCase().includes('urgente') && (
        <div className="absolute -top-1 -left-1">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Hover tooltip content (will be shown via CSS or tooltip library) */}
      <div className="sr-only">
        {`${appointment.patient.name} - ${appointment.service?.name || 'Consulta'}`}
        <br />
        {`${startTime} - ${endTime} (${appointment.duration}min)`}
        <br />
        {`Dr. ${appointment.dentist.name}`}
        <br />
        {`Estado: ${statusLabels[appointment.status]}`}
        {appointment.notes && (
          <>
            <br />
            {`Notas: ${appointment.notes}`}
          </>
        )}
      </div>
    </div>
  )
}