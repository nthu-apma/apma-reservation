import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendConsultationSubmitted, sendAdminNewConsultation } from '@/lib/email'
import { z } from 'zod'

const createSchema = z.object({
  equipmentId: z.string(),
  formData: z.record(z.string()),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: {
      equipment: { select: { id: true, name: true, nameEn: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reservations)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const equipment = await prisma.equipment.findUnique({
      where: { id: data.equipmentId },
      include: { admins: { include: { user: { select: { email: true } } } } },
    })
    if (!equipment) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })

    const reservation = await prisma.reservation.create({
      data: { userId: session.user.id, equipmentId: data.equipmentId, formData: data.formData },
      include: { equipment: { select: { name: true } }, user: { select: { name: true, email: true } } },
    })

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    try {
      await sendConsultationSubmitted(session.user.email, {
        userName: session.user.name,
        equipmentName: reservation.equipment.name,
        reservationId: reservation.id,
      })

      const adminEmails = equipment.admins.length > 0
        ? equipment.admins.map((a) => a.user.email)
        : await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' }, select: { email: true } }).then((u) => u.map((x) => x.email))

      await Promise.all(
        adminEmails.map((email) =>
          sendAdminNewConsultation(email, {
            userName: reservation.user.name,
            userEmail: reservation.user.email,
            equipmentName: reservation.equipment.name,
            reservationId: reservation.id,
            appUrl,
          })
        )
      )
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ id: reservation.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
