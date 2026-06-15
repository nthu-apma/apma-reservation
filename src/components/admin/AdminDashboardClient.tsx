'use client'
import Link from 'next/link'
import { CalendarCheck, Users, FlaskConical, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor, formatTimeSlot } from '@/lib/utils'

interface Stats {
  totalReservations: number; pendingReservations: number
  confirmedReservations: number; completedReservations: number
  cancelledReservations: number; noShowReservations: number
  totalUsers: number; totalEquipment: number
}

interface RecentReservation {
  id: string; status: string
  user: { name: string; email: string }
  equipment: { name: string }
  timeSlot: { date: string; startTime: string; endTime: string }
}

export function AdminDashboardClient({ stats, recentReservations }: { stats: Stats; recentReservations: RecentReservation[] }) {
  const { lang, t } = useLanguage()

  const statCards = [
    { label: t.admin.stats.pending, value: stats.pendingReservations, icon: Clock, color: 'text-yellow-600', href: '/admin/reservations?status=PENDING' },
    { label: t.admin.stats.confirmed, value: stats.confirmedReservations, icon: CheckCircle, color: 'text-blue-600', href: '/admin/reservations?status=CONFIRMED' },
    { label: t.admin.stats.completed, value: stats.completedReservations, icon: CheckCircle, color: 'text-green-600', href: '/admin/reservations?status=COMPLETED' },
    { label: t.admin.stats.totalReservations, value: stats.totalReservations, icon: CalendarCheck, color: 'text-primary', href: '/admin/reservations' },
    { label: t.admin.stats.totalUsers, value: stats.totalUsers, icon: Users, color: 'text-indigo-600', href: '/admin/users' },
    { label: t.admin.stats.totalEquipment, value: stats.totalEquipment, icon: FlaskConical, color: 'text-violet-600', href: '/admin/equipment' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">{t.admin.dashboard}</h1>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <card.icon className={cn('h-8 w-8 opacity-70', card.color)} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending alert */}
      {stats.pendingReservations > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-400">
                  {lang === 'zh'
                    ? `有 ${stats.pendingReservations} 筆預約待審核`
                    : `${stats.pendingReservations} reservation(s) pending review`}
                </span>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/reservations?status=PENDING">
                  {lang === 'zh' ? '前往審核' : 'Review Now'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent reservations */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{lang === 'zh' ? '最近預約' : 'Recent Reservations'}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/reservations">{lang === 'zh' ? '查看全部' : 'View All'}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.user.name} · {r.equipment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.timeSlot.date} {formatTimeSlot(r.timeSlot.startTime, r.timeSlot.endTime)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={cn('text-xs', getStatusColor(r.status))}>
                    {(t.reservation.status_label as Record<string, string>)[r.status]}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/reservations/${r.id}`}>{lang === 'zh' ? '查看' : 'View'}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
