import { prisma } from '@/lib/prisma'
import { AdminLabsClient } from '@/components/admin/AdminLabsClient'

export default async function AdminLabsPage() {
  const labs = await prisma.lab.findMany({ orderBy: { order: 'asc' } })
  return <AdminLabsClient labs={labs} />
}
