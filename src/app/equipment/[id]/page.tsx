export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EquipmentDetailClient } from '@/components/equipment/EquipmentDetailClient'
import { format, addDays, startOfDay } from 'date-fns'

export default async function EquipmentPage({ params }: { params: { id: string } }) {
  const equipment = await prisma.equipment.findUnique({ where: { id: params.id } })
  if (!equipment) notFound()

  const today = startOfDay(new Date())
  const futureDate = addDays(today, 60)

  const slots = await prisma.timeSlot.findMany({
    where: {
      equipmentId: params.id,
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
    <EquipmentDetailClient
      equipment={{
        ...equipment,
        formFields: equipment.formFields as never,
      }}
      timeSlots={availableSlots}
    />
  )
}
