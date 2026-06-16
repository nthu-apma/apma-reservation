import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) redirect('/')

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminNav />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
