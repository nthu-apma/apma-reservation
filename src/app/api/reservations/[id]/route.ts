import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, institution: true, lab: true } },
      equipment: { select: { id: true, name: true, nameEn: true, formFields: true } },
      notes: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = reservation.userId === session.user.id
  const isAdmin = isAdminRole(session.user.role)
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(reservation)
}

const cancelSchema = z.object({ cancelReason: z.string().optional() })

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservation = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (reservation.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
    return NextResponse.json({ error: 'Cannot cancel this reservation' }, { status: 400 })
  }

  const body = await req.json()
  const data = cancelSchema.parse(body)

  const updated = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: 'CANCELLED', cancelReason: data.cancelReason },
  })

  return NextResponse.json(updated)
}
