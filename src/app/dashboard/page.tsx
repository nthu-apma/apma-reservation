import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: {
      equipment: { select: { id: true, name: true, nameEn: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <DashboardClient reservations={reservations} />
}
