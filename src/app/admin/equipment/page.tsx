import { prisma } from '@/lib/prisma'
import { AdminEquipmentClient } from '@/components/admin/AdminEquipmentClient'

export default async function AdminEquipmentPage() {
  const equipment = await prisma.equipment.findMany({ orderBy: { order: 'asc' } })
  return (
    <AdminEquipmentClient
      equipment={equipment.map((e) => ({ ...e, formFields: e.formFields as never }))}
    />
  )
}
