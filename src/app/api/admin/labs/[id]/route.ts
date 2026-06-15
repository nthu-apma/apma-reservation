import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  logoUrl: z.string().optional(),
  logoUrlDark: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  active: z.boolean().optional(),
})

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user.role === 'ADMIN' ? session : null
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)
    const lab = await prisma.lab.update({ where: { id: params.id }, data })
    return NextResponse.json(lab)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.lab.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
