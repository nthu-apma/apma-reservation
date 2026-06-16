import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReservationDetailClient } from '@/components/reservations/ReservationDetailClient'
import { format } from 'date-fns'

export default async function ReservationDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, institution: true, lab: true } },
      equipment: { select: { id: true, name: true, nameEn: true, formFields: true } },
      timeSlot: { select: { date: true, startTime: true, endTime: true } },
      notes: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!reservation) notFound()

  const isOwner = reservation.userId === session.user.id
  const isStaff = session.user.role === 'ADMIN'
  if (!isOwner && !isStaff) redirect('/dashboard')

  return (
    <ReservationDetailClient
      reservation={{
        ...reservation,
        formData: (reservation.formData ?? {}) as Record<string, string>,
        timeSlot: { ...reservation.timeSlot, date: format(reservation.timeSlot.date, 'yyyy-MM-dd') },
        equipment: { ...reservation.equipment, formFields: reservation.equipment.formFields as never },
      }}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  )
}
