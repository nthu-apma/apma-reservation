import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminEquipmentClient } from '@/components/admin/AdminEquipmentClient'
import { redirect } from 'next/navigation'

export default async function AdminEquipmentPage() {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) redirect('/')

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

  let equipmentData
  if (isSuperAdmin) {
    equipmentData = await prisma.equipment.findMany({
      include: { admins: { include: { user: { select: { id: true, name: true } } } } },
      orderBy: { order: 'asc' },
    })
  } else {
    const myEquipment = await prisma.equipmentAdmin.findMany({
      where: { userId: session.user.id },
      select: { equipmentId: true },
    })
    equipmentData = await prisma.equipment.findMany({
      where: { id: { in: myEquipment.map((e) => e.equipmentId) } },
      include: { admins: { include: { user: { select: { id: true, name: true } } } } },
      orderBy: { order: 'asc' },
    })
  }

  return (
    <AdminEquipmentClient
      equipment={equipmentData.map((e) => ({ ...e, formFields: e.formFields as never }))}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
