import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const labs = await prisma.lab.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(labs)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
