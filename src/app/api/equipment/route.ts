import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { status: { not: 'INACTIVE' } },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        category: true,
        imageUrl: true,
        status: true,
        order: true,
      },
    })
    return NextResponse.json(equipment)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
