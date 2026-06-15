import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservation = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = reservation.userId === session.user.id
  const isStaff = ['ADMIN', 'ASSISTANT'].includes(session.user.role)
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const notes = await prisma.note.findMany({
    where: { reservationId: params.id },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(notes)
}

const noteSchema = z.object({ content: z.string().min(1) })

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservation = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = reservation.userId === session.user.id
  const isStaff = ['ADMIN', 'ASSISTANT'].includes(session.user.role)
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { content } = noteSchema.parse(body)

  const note = await prisma.note.create({
    data: { reservationId: params.id, authorId: session.user.id, content },
    include: { author: { select: { id: true, name: true, role: true } } },
  })

  return NextResponse.json(note, { status: 201 })
}
