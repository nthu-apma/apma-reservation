import { prisma } from '@/lib/prisma'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, institution: true,
      lab: true, role: true, avatarUrl: true, createdAt: true,
      _count: { select: { reservations: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return <AdminUsersClient users={users} />
}
