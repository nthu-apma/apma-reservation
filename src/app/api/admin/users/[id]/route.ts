import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'SUPER_ADMIN role is fixed and cannot be changed' }, { status: 403 })
  }

  const body = await req.json()
  const { role } = schema.parse(body)

  // Only SUPER_ADMIN can assign SUPER_ADMIN or manage roles
  if (session.user.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role, authorizedBy: role !== 'USER' ? session.user.id : null },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cannot delete a SUPER_ADMIN account' }, { status: 403 })
  }

  const activeReservations = await prisma.reservation.count({
    where: { userId: params.id, status: { in: ['PENDING', 'CONFIRMED'] } },
  })

  if (activeReservations > 0) {
    return NextResponse.json(
      { error: `此用戶還有 ${activeReservations} 筆進行中的申請，請先處理後再刪除。` },
      { status: 409 }
    )
  }

  await prisma.note.deleteMany({ where: { authorId: params.id } })
  await prisma.reservation.deleteMany({ where: { userId: params.id } })
  await prisma.user.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
