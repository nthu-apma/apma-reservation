import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const equipmentId = searchParams.get('equipmentId')

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status
  if (equipmentId) where.equipmentId = equipmentId

  // ADMIN (not SUPER_ADMIN) can only see their equipment's reservations
  if (session.user.role === 'ADMIN') {
    const myEquipment = await prisma.equipmentAdmin.findMany({
      where: { userId: session.user.id },
      select: { equipmentId: true },
    })
    const myEquipmentIds = myEquipment.map((e) => e.equipmentId)
    where.equipmentId = equipmentId
      ? (myEquipmentIds.includes(equipmentId) ? equipmentId : '__none__')
      : { in: myEquipmentIds }
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, institution: true, lab: true } },
      equipment: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reservations)
}
