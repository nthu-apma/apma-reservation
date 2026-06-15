import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  notices: z.string().optional(),
  noticesEn: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  contactPerson: z.string().optional(),
  contactLab: z.string().optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
  formFields: z.array(z.any()).optional(),
  order: z.number().optional(),
})

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user.role === 'ADMIN' ? session : null
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const equipment = await prisma.equipment.findUnique({ where: { id: params.id } })
  if (!equipment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(equipment)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)
    const equipment = await prisma.equipment.update({ where: { id: params.id }, data })
    return NextResponse.json(equipment)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.equipment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
