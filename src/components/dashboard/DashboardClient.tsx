'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, FileText, FlaskConical, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor, formatDate, formatTimeSlot } from '@/lib/utils'

interface Reservation {
  id: string
  status: string
  createdAt: Date
  adminNote?: string | null
  equipment: { id: string; name: string; nameEn?: string | null }
  timeSlot: { date: string; startTime: string; endTime: string }
  _count: { notes: number }
}

export function DashboardClient({ reservations }: { reservations: Reservation[] }) {
  const { lang, t } = useLanguage()
  const [tab, setTab] = useState('ALL')

  const statusTabs = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

  const filtered = tab === 'ALL' ? reservations : reservations.filter((r) => r.status === tab)

  const statusLabel = (s: string) => {
    return (t.reservation.status_label as Record<string, string>)[s] || s
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
        <Button asChild size="sm">
          <Link href="/">{lang === 'zh' ? '新增預約' : 'New Booking'}</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1 mb-6">
          {statusTabs.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {s === 'ALL' ? t.dashboard.filterAll : statusLabel(s)}
              <span className="ml-1 text-xs opacity-60">
                ({s === 'ALL' ? reservations.length : reservations.filter((r) => r.status === s).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="mb-4">{t.dashboard.noReservations}</p>
              <Button asChild variant="outline">
                <Link href="/">{t.dashboard.bookNow}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => {
                const eqName = lang === 'zh' ? r.equipment.name : (r.equipment.nameEn || r.equipment.name)
                return (
                  <Card key={r.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{eqName}</p>
                            <Badge className={cn('text-xs', getStatusColor(r.status))}>
                              {statusLabel(r.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {r.timeSlot.date} {formatTimeSlot(r.timeSlot.startTime, r.timeSlot.endTime)}
                            </span>
                            {r._count.notes > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {r._count.notes} {lang === 'zh' ? '則筆記' : 'notes'}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/reservations/${r.id}`}>
                            <FileText className="h-3 w-3 mr-1" />
                            {t.common.view}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
