export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EquipmentDetailClient } from '@/components/equipment/EquipmentDetailClient'

export default async function EquipmentPage({ params }: { params: { id: string } }) {
  const equipment = await prisma.equipment.findUnique({ where: { id: params.id } })
  if (!equipment) notFound()

  return (
    <EquipmentDetailClient
      equipment={{ ...equipment, formFields: equipment.formFields as never }}
    />
  )
}
