import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReservationSubmitted, sendAdminNewReservation } from '@/lib/email'
import { format } from 'date-fns'
import { z } from 'zod'

const createSchema = z.object({
  equipmentId: z.string(),
  timeSlotId: z.string(),
  formData: z.record(z.string()),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: {
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const slot = await prisma.timeSlot.findUnique({
      where: { id: data.timeSlotId },
      include: { reservation: true },
    })
    if (!slot) return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    if (slot.reservation && slot.reservation.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Time slot already booked' }, { status: 409 })
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: session.user.id,
        equipmentId: data.equipmentId,
        timeSlotId: data.timeSlotId,
        formData: data.formData,
      },
      include: {
        equipment: { select: { name: true } },
        timeSlot: { select: { date: true, startTime: true, endTime: true } },
        user: { select: { name: true, email: true } },
      },
    })

    const dateStr = format(reservation.timeSlot.date, 'yyyy-MM-dd')
    const timeStr = `${reservation.timeSlot.startTime} – ${reservation.timeSlot.endTime}`
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    try {
      await sendReservationSubmitted(session.user.email, {
        userName: session.user.name,
        equipmentName: reservation.equipment.name,
        date: dateStr,
        timeSlot: timeStr,
        reservationId: reservation.id,
      })

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } })
      await Promise.all(
        admins.map((a) =>
          sendAdminNewReservation(a.email, {
            userName: reservation.user.name,
            userEmail: reservation.user.email,
            equipmentName: reservation.equipment.name,
            date: dateStr,
            timeSlot: timeStr,
            reservationId: reservation.id,
            appUrl,
          })
        )
      )
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ id: reservation.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
