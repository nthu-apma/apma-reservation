export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { AdminTimeslotsClient } from '@/components/admin/AdminTimeslotsClient'
import { format, subMonths, addMonths, startOfDay } from 'date-fns'

export default async function AdminTimeslotsPage({ searchParams }: { searchParams: { equipmentId?: string } }) {
  const equipment = await prisma.equipment.findMany({
    where: { status: { not: 'INACTIVE' } },
    orderBy: { order: 'asc' },
    select: { id: true, name: true },
  })

  const selectedEquipmentId = searchParams.equipmentId || equipment[0]?.id

  let slots: { id: string; date: string; startTime: string; endTime: string; available: boolean; reservation: { status: string; user: { name: string } } | null }[] = []

  if (selectedEquipmentId) {
    const from = subMonths(startOfDay(new Date()), 2)
    const to = addMonths(startOfDay(new Date()), 13)
    const rawSlots = await prisma.timeSlot.findMany({
      where: { equipmentId: selectedEquipmentId, date: { gte: from, lte: to } },
      include: { reservation: { select: { status: true, user: { select: { name: true } } } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    slots = rawSlots.map((s) => ({ ...s, date: format(s.date, 'yyyy-MM-dd') }))
  }

  return (
    <AdminTimeslotsClient
      equipment={equipment}
      selectedEquipmentId={selectedEquipmentId || ''}
      slots={slots}
    />
  )
}
