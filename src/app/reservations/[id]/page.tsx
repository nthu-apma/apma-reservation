import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReservationDetailClient } from '@/components/reservations/ReservationDetailClient'

export default async function ReservationDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, institution: true, lab: true } },
      equipment: { select: { id: true, name: true, nameEn: true, formFields: true } },
      notes: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!reservation) notFound()

  const isOwner = reservation.userId === session.user.id
  let isStaff = isAdminRole(session.user.role)
  if (isStaff && session.user.role === 'ADMIN') {
    const isMyEquipment = await prisma.equipmentAdmin.findFirst({
      where: { equipmentId: reservation.equipmentId, userId: session.user.id },
    })
    isStaff = !!isMyEquipment
  }
  if (!isOwner && !isStaff) redirect('/dashboard')

  return (
    <ReservationDetailClient
      reservation={{
        ...reservation,
        formData: (reservation.formData ?? {}) as Record<string, string>,
        equipment: { ...reservation.equipment, formFields: reservation.equipment.formFields as never },
      }}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  )
}
