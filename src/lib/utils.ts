import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, lang: 'zh' | 'en' = 'zh') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (lang === 'zh') return format(d, 'yyyy年MM月dd日', { locale: zhTW })
  return format(d, 'MMM dd, yyyy')
}

export function formatDateTime(date: Date | string, lang: 'zh' | 'en' = 'zh') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (lang === 'zh') return format(d, 'yyyy年MM月dd日 HH:mm', { locale: zhTW })
  return format(d, 'MMM dd, yyyy HH:mm')
}

export function formatTimeSlot(startTime: string, endTime: string) {
  return `${startTime} – ${endTime}`
}

export function isAdminRoleClient(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}
