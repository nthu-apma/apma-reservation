import { Role, EquipmentStatus, ReservationStatus } from '@prisma/client'

export type { Role, EquipmentStatus, ReservationStatus }

export interface FormField {
  id: string
  label: string
  labelEn?: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'url' | 'file'
  required: boolean
  placeholder?: string
  placeholderEn?: string
  options?: string[]
  optionsEn?: string[]
  hint?: string
  hintEn?: string
  conditionalOn?: string
  conditionalValue?: string
}

export interface UserPublic {
  id: string
  email: string
  name: string
  institution?: string | null
  lab?: string | null
  phone?: string | null
  role: Role
  createdAt: Date
}

export interface LabData {
  id: string
  name: string
  nameEn?: string | null
  logoUrl?: string | null
  logoUrlDark?: string | null
  website?: string | null
  description?: string | null
  order: number
  active: boolean
}

export interface EquipmentData {
  id: string
  name: string
  nameEn?: string | null
  description?: string | null
  descriptionEn?: string | null
  notices?: string | null
  noticesEn?: string | null
  category?: string | null
  imageUrl?: string | null
  status: EquipmentStatus
  formFields: FormField[]
  order: number
}

export interface TimeSlotData {
  id: string
  equipmentId: string
  date: string
  startTime: string
  endTime: string
  available: boolean
  reservation?: { id: string } | null
}

export interface ReservationData {
  id: string
  userId: string
  equipmentId: string
  timeSlotId: string
  status: ReservationStatus
  formData: Record<string, string>
  adminNote?: string | null
  cancelReason?: string | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
    institution?: string | null
    lab?: string | null
  }
  equipment: {
    id: string
    name: string
    nameEn?: string | null
  }
  timeSlot: {
    id: string
    date: string
    startTime: string
    endTime: string
  }
  notes?: NoteData[]
}

export interface NoteData {
  id: string
  reservationId: string
  authorId: string
  content: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    name: string
    role: Role
  }
}

export interface AdminStats {
  totalReservations: number
  pendingReservations: number
  confirmedReservations: number
  completedReservations: number
  cancelledReservations: number
  noShowReservations: number
  totalUsers: number
  totalEquipment: number
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      avatarUrl?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
