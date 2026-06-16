import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const equipment = await prisma.equipment.findUnique({ where: { id: params.id } })
    if (!equipment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(equipment)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
