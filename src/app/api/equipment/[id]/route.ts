import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, addDays, startOfDay } from 'date-fns'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
    })
    if (!equipment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const today = startOfDay(new Date())
    const futureDate = addDays(today, 60)

    const slots = await prisma.timeSlot.findMany({
      where: {
        equipmentId: params.id,
        date: { gte: today, lte: futureDate },
        available: true,
      },
      include: { reservation: { select: { id: true, status: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    const availableSlots = slots.filter(
      (s) => !s.reservation || s.reservation.status === 'CANCELLED'
    ).map((s) => ({
      id: s.id,
      date: format(s.date, 'yyyy-MM-dd'),
      startTime: s.startTime,
      endTime: s.endTime,
      available: true,
    }))

    return NextResponse.json({ ...equipment, timeSlots: availableSlots })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
