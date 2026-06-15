import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { format, addDays, startOfDay } from 'date-fns'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const equipmentId = searchParams.get('equipmentId')
  if (!equipmentId) return NextResponse.json({ error: 'equipmentId required' }, { status: 400 })

  const today = startOfDay(new Date())
  const slots = await prisma.timeSlot.findMany({
    where: { equipmentId, date: { gte: today } },
    include: { reservation: { select: { id: true, status: true, user: { select: { name: true } } } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json(
    slots.map((s) => ({ ...s, date: format(s.date, 'yyyy-MM-dd') }))
  )
}

const createSchema = z.object({
  equipmentId: z.string(),
  slots: z.array(
    z.object({
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { equipmentId, slots } = createSchema.parse(body)

    const created = await prisma.timeSlot.createMany({
      data: slots.map((s) => ({
        equipmentId,
        date: new Date(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ count: created.count }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
