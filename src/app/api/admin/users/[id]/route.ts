import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const body = await req.json()
  const { role } = schema.parse(body)

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      role,
      authorizedBy: role !== 'USER' ? session.user.id : null,
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const activeReservations = await prisma.reservation.count({
    where: { userId: params.id, status: { in: ['PENDING', 'CONFIRMED'] } },
  })

  if (activeReservations > 0) {
    return NextResponse.json(
      { error: `此用戶還有 ${activeReservations} 筆進行中的預約，請先處理後再刪除。` },
      { status: 409 }
    )
  }

  // Delete notes authored by user, then reservations, then user
  await prisma.note.deleteMany({ where: { authorId: params.id } })
  await prisma.reservation.deleteMany({ where: { userId: params.id } })
  await prisma.user.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
