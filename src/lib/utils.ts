import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeStyle: 'short',
  }).format(date)
}

export function getAppointmentDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

export function createTimeSlots(startTime: string, endTime: string, slotDuration: number = 30): string[] {
  const slots: string[] = []
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  let currentHour = startHour
  let currentMinute = startMinute
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    slots.push(timeString)
    
    currentMinute += slotDuration
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60)
      currentMinute = currentMinute % 60
    }
  }
  
  return slots
}