import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: {
      equipment: { select: { id: true, name: true, nameEn: true } },
      timeSlot: { select: { date: true, startTime: true, endTime: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = reservations.map((r) => ({
    ...r,
    timeSlot: { ...r.timeSlot, date: format(r.timeSlot.date, 'yyyy-MM-dd') },
  }))

  return <DashboardClient reservations={data} />
}
