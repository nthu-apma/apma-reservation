import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [statusCounts, totalUsers, totalEquipment] = await Promise.all([
    prisma.reservation.groupBy({ by: ['status'], _count: true }),
    prisma.user.count(),
    prisma.equipment.count(),
  ])

  const counts: Record<string, number> = {}
  for (const row of statusCounts) {
    counts[row.status] = row._count
  }

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
