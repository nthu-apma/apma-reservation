import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReservationConfirmed, sendReservationRejected } from '@/lib/email'
import { format } from 'date-fns'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['CONFIRM', 'REJECT', 'COMPLETE', 'NO_SHOW', 'ARCHIVE', 'UNARCHIVE']),
  adminNote: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, adminNote } = actionSchema.parse(body)

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      equipment: { select: { name: true } },
      timeSlot: { select: { date: true, startTime: true, endTime: true } },
    },
  })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'ARCHIVE' || action === 'UNARCHIVE') {
    const updated = await prisma.reservation.update({
      where: { id: params.id },
      data: { archived: action === 'ARCHIVE' },
    })
    return NextResponse.json(updated)
  }

  const statusMap = {
    CONFIRM: 'CONFIRMED',
    REJECT: 'CANCELLED',
    COMPLETE: 'COMPLETED',
    NO_SHOW: 'NO_SHOW',
  } as const

  const updated = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: statusMap[action as keyof typeof statusMap], adminNote },
  })

  const dateStr = format(reservation.timeSlot.date, 'yyyy-MM-dd')
  const timeStr = `${reservation.timeSlot.startTime} – ${reservation.timeSlot.endTime}`

  try {
    if (action === 'CONFIRM') {
      await sendReservationConfirmed(reservation.user.email, {
        userName: reservation.user.name,
        equipmentName: reservation.equipment.name,
        date: dateStr,
        timeSlot: timeStr,
        adminNote,
      })
    } else if (action === 'REJECT') {
      await sendReservationRejected(reservation.user.email, {
        userName: reservation.user.name,
        equipmentName: reservation.equipment.name,
        date: dateStr,
        adminNote,
      })
    }
  } catch (emailErr) {
    console.error('Email error:', emailErr)
  }

  return NextResponse.json(updated)
}
