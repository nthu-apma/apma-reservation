import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const equipmentId = searchParams.get('equipmentId')

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status
  if (equipmentId) where.equipmentId = equipmentId

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, institution: true, lab: true } },
      equipment: { select: { id: true, name: true, nameEn: true } },
      timeSlot: { select: { id: true, date: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    reservations.map((r) => ({
      ...r,
      timeSlot: { ...r.timeSlot, date: format(r.timeSlot.date, 'yyyy-MM-dd') },
    }))
  )
}
