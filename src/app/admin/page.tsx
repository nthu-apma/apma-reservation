import { prisma } from '@/lib/prisma'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

export default async function AdminDashboardPage() {
  const [statusCounts, totalUsers, totalEquipment, recentReservations] = await Promise.all([
    prisma.reservation.groupBy({ by: ['status'], _count: true }),
    prisma.user.count(),
    prisma.equipment.count(),
    prisma.reservation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        equipment: { select: { name: true } },
        timeSlot: { select: { date: true, startTime: true, endTime: true } },
      },
    }),
  ])

  const counts: Record<string, number> = {}
  for (const row of statusCounts) counts[row.status] = row._count

  const stats = {
    totalReservations: Object.values(counts).reduce((a, b) => a + b, 0),
    pendingReservations: counts.PENDING ?? 0,
    confirmedReservations: counts.CONFIRMED ?? 0,
    completedReservations: counts.COMPLETED ?? 0,
    cancelledReservations: counts.CANCELLED ?? 0,
    noShowReservations: counts.NO_SHOW ?? 0,
    totalUsers,
    totalEquipment,
  }

  return (
    <AdminDashboardClient
      stats={stats}
      recentReservations={recentReservations.map((r) => ({
        ...r,
        timeSlot: {
          ...r.timeSlot,
          date: r.timeSlot.date.toISOString().split('T')[0],
        },
      }))}
    />
  )
}
