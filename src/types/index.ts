import { User, Patient, Appointment, Service, Organization } from '@prisma/client'

export type UserWithOrganization = User & {
  organization: Organization
}

export type PatientWithAppointments = Patient & {
  appointments: Appointment[]
}

export type AppointmentWithRelations = Appointment & {
  patient: Patient
  dentist: User
  service: Service | null
  organization: Organization
}

export type CreateAppointmentData = {
  patientId: string
  dentistId: string
  serviceId?: string
  startTime: Date
  endTime: Date
  notes?: string
}

export type AppointmentFilters = {
  dentistId?: string
  patientId?: string
  status?: string
  date?: Date
}

export interface DashboardStats {
  totalAppointments: number
  confirmedAppointments: number
  noShowRate: number
  upcomingAppointments: number
}