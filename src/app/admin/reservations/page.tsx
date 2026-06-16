export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminReservationsClient } from '@/components/admin/AdminReservationsClient'
import { redirect } from 'next/navigation'

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: { status?: string; equipmentId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) redirect('/')

  const where: Record<string, unknown> = {}
  if (searchParams.status && searchParams.status !== 'ALL') where.status = searchParams.status
  if (searchParams.equipmentId) where.equipmentId = searchParams.equipmentId

  if (session.user.role === 'ADMIN') {
    const myEquipment = await prisma.equipmentAdmin.findMany({
      where: { userId: session.user.id },
      select: { equipmentId: true },
    })
    const myEquipmentIds = myEquipment.map((e) => e.equipmentId)
    where.equipmentId = searchParams.equipmentId
      ? (myEquipmentIds.includes(searchParams.equipmentId) ? searchParams.equipmentId : '__none__')
      : { in: myEquipmentIds }
  }

  const [reservations, equipment] = await Promise.all([
    prisma.reservation.findMany({
      where,
      select: {
        id: true, status: true, archived: true, createdAt: true, formData: true,
        user: { select: { id: true, name: true, email: true, institution: true, lab: true } },
        equipment: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    session.user.role === 'SUPER_ADMIN'
      ? prisma.equipment.findMany({ select: { id: true, name: true }, orderBy: { order: 'asc' } })
      : prisma.equipmentAdmin.findMany({
          where: { userId: session.user.id },
          include: { equipment: { select: { id: true, name: true } } },
          orderBy: { equipment: { order: 'asc' } },
        }).then((rows) => rows.map((r) => r.equipment)),
  ])

  return (
    <AdminReservationsClient
      reservations={reservations.map((r) => ({
        ...r,
        formData: (r.formData ?? {}) as Record<string, string>,
      }))}
      equipment={equipment}
      currentStatus={searchParams.status || 'ALL'}
    />
  )
}
