export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { AdminReservationsClient } from '@/components/admin/AdminReservationsClient'
import { format } from 'date-fns'

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: { status?: string; equipmentId?: string }
}) {
  const where: Record<string, unknown> = {}
  if (searchParams.status && searchParams.status !== 'ALL') where.status = searchParams.status
  if (searchParams.equipmentId) where.equipmentId = searchParams.equipmentId

  const [reservations, equipment] = await Promise.all([
    prisma.reservation.findMany({
      where,
      select: {
        id: true, status: true, archived: true, createdAt: true, formData: true,
        user: { select: { id: true, name: true, email: true, institution: true, lab: true } },
        equipment: { select: { id: true, name: true } },
        timeSlot: { select: { date: true, startTime: true, endTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.equipment.findMany({ select: { id: true, name: true }, orderBy: { order: 'asc' } }),
  ])

  return (
    <AdminReservationsClient
      reservations={reservations.map((r) => ({
        ...r,
        formData: (r.formData ?? {}) as Record<string, string>,
        timeSlot: { ...r.timeSlot, date: format(r.timeSlot.date, 'yyyy-MM-dd') },
      }))}
      equipment={equipment}
      currentStatus={searchParams.status || 'ALL'}
    />
  )
}
