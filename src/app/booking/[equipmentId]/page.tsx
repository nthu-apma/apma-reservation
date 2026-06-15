export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookingClient } from '@/components/booking/BookingClient'
import { format, addDays, startOfDay } from 'date-fns'

export default async function BookingPage({ params }: { params: { equipmentId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/auth/login?callbackUrl=/booking/${params.equipmentId}`)

  const equipment = await prisma.equipment.findUnique({ where: { id: params.equipmentId } })
  if (!equipment || equipment.status !== 'ACTIVE') notFound()

  const today = startOfDay(new Date())
  const futureDate = addDays(today, 60)

  const slots = await prisma.timeSlot.findMany({
    where: {
      equipmentId: params.equipmentId,
      date: { gte: today, lte: futureDate },
      available: true,
    },
    include: { reservation: { select: { status: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  const availableSlots = slots
    .filter((s) => !s.reservation || s.reservation.status === 'CANCELLED')
    .map((s) => ({
      id: s.id,
      date: format(s.date, 'yyyy-MM-dd'),
      startTime: s.startTime,
      endTime: s.endTime,
    }))

  return (
    <BookingClient
      equipment={{ ...equipment, formFields: equipment.formFields as never }}
      timeSlots={availableSlots}
    />
  )
}
