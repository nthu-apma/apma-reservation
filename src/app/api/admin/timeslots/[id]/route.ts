import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slot = await prisma.timeSlot.findUnique({
    where: { id: params.id },
    include: { reservation: { select: { status: true } } },
  })
  if (!slot) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (slot.reservation && !['CANCELLED'].includes(slot.reservation.status)) {
    return NextResponse.json({ error: 'Cannot delete slot with active reservation' }, { status: 400 })
  }

  await prisma.timeSlot.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
