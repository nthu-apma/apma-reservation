import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncPrimaryAdminFromContact } from '@/lib/equipmentAdmin'
import { z } from 'zod'

const equipmentSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  notices: z.string().optional(),
  noticesEn: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactLab: z.string().optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
  formFields: z.array(z.any()),
  order: z.number().default(0),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.user.role === 'ADMIN') {
    const myEquipment = await prisma.equipmentAdmin.findMany({
      where: { userId: session.user.id },
      select: { equipmentId: true },
    })
    const equipment = await prisma.equipment.findMany({
      where: { id: { in: myEquipment.map((e) => e.equipmentId) } },
      include: { admins: { include: { user: { select: { id: true, name: true } } } } },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(equipment)
  }

  const equipment = await prisma.equipment.findMany({
    include: { admins: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(equipment)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = equipmentSchema.parse(body)
    const equipment = await prisma.equipment.create({ data })
    await syncPrimaryAdminFromContact(equipment.id, data.contactEmail)
    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
