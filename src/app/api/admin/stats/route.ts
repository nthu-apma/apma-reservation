import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let equipmentFilter: { equipmentId?: { in: string[] } } = {}
  if (session.user.role === 'ADMIN') {
    const myEquipment = await prisma.equipmentAdmin.findMany({
      where: { userId: session.user.id },
      select: { equipmentId: true },
    })
    equipmentFilter = { equipmentId: { in: myEquipment.map((e) => e.equipmentId) } }
  }

  const [statusCounts, totalUsers, totalEquipment] = await Promise.all([
    prisma.reservation.groupBy({ by: ['status'], where: equipmentFilter, _count: true }),
    prisma.user.count(),
    session.user.role === 'SUPER_ADMIN'
      ? prisma.equipment.count()
      : prisma.equipmentAdmin.count({ where: { userId: session.user.id } }),
  ])

  const counts: Record<string, number> = {}
  for (const row of statusCounts) counts[row.status] = row._count

  return NextResponse.json({
    totalReservations: Object.values(counts).reduce((a, b) => a + b, 0),
    pendingReservations: counts.PENDING ?? 0,
    confirmedReservations: counts.CONFIRMED ?? 0,
    completedReservations: counts.COMPLETED ?? 0,
    cancelledReservations: counts.CANCELLED ?? 0,
    noShowReservations: counts.NO_SHOW ?? 0,
    totalUsers,
    totalEquipment,
  })
}
