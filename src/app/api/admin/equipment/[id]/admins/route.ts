import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addSchema = z.object({ userId: z.string(), isPrimary: z.boolean().default(false) })

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admins = await prisma.equipmentAdmin.findMany({
    where: { equipmentId: params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { isPrimary: 'desc' },
  })

  return NextResponse.json(admins)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, isPrimary } = addSchema.parse(body)

  const admin = await prisma.equipmentAdmin.upsert({
    where: { equipmentId_userId: { equipmentId: params.id, userId } },
    create: { equipmentId: params.id, userId, isPrimary },
    update: { isPrimary },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(admin, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  await prisma.equipmentAdmin.delete({
    where: { equipmentId_userId: { equipmentId: params.id, userId } },
  })

  return NextResponse.json({ success: true })
}
