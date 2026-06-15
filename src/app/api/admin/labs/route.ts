import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const labSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional(),
  logoUrl: z.string().optional(),
  logoUrlDark: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  order: z.number().default(0),
  active: z.boolean().default(true),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const labs = await prisma.lab.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(labs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = labSchema.parse(body)
    const lab = await prisma.lab.create({ data })
    return NextResponse.json(lab, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
