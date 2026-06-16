import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendConsultationConfirmed, sendConsultationRejected } from '@/lib/email'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['CONFIRM', 'REJECT', 'COMPLETE', 'NO_SHOW', 'ARCHIVE', 'UNARCHIVE']),
  adminNote: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, adminNote } = actionSchema.parse(body)

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      equipment: { select: { name: true, admins: { select: { userId: true } } } },
    },
  })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ADMIN can only act on their equipment
  if (session.user.role === 'ADMIN') {
    const isMyEquipment = reservation.equipment.admins.some((a) => a.userId === session.user.id)
    if (!isMyEquipment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (action === 'ARCHIVE' || action === 'UNARCHIVE') {
    const updated = await prisma.reservation.update({
      where: { id: params.id },
      data: { archived: action === 'ARCHIVE' },
    })
    return NextResponse.json(updated)
  }

  const statusMap = {
    CONFIRM: 'CONFIRMED', REJECT: 'CANCELLED', COMPLETE: 'COMPLETED', NO_SHOW: 'NO_SHOW',
  } as const

  const updated = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: statusMap[action as keyof typeof statusMap], adminNote },
  })

  try {
    if (action === 'CONFIRM') {
      await sendConsultationConfirmed(reservation.user.email, {
        userName: reservation.user.name,
        equipmentName: reservation.equipment.name,
        adminNote,
      })
    } else if (action === 'REJECT') {
      await sendConsultationRejected(reservation.user.email, {
        userName: reservation.user.name,
        equipmentName: reservation.equipment.name,
        adminNote,
      })
    }
  } catch (emailErr) {
    console.error('Email error:', emailErr)
  }

  return NextResponse.json(updated)
}
