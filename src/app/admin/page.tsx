import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)!

  let equipmentFilter: { equipmentId?: { in: string[] } } = {}
  if (session?.user.role === 'ADMIN') {
    const myEquipment = await prisma.equipmentAdmin.findMany({
      where: { userId: session.user.id },
      select: { equipmentId: true },
    })
    equipmentFilter = { equipmentId: { in: myEquipment.map((e) => e.equipmentId) } }
  }

  const [statusCounts, totalUsers, totalEquipment, recentReservations] = await Promise.all([
    prisma.reservation.groupBy({ by: ['status'], where: equipmentFilter, _count: true }),
    prisma.user.count(),
    session?.user.role === 'SUPER_ADMIN'
      ? prisma.equipment.count()
      : prisma.equipmentAdmin.count({ where: { userId: session?.user.id } }),
    prisma.reservation.findMany({
      take: 5,
      where: equipmentFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        equipment: { select: { name: true } },
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

  return <AdminDashboardClient stats={stats} recentReservations={recentReservations} />
}
