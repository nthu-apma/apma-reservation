'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, CheckCircle2, UserX, Eye, Archive, ArchiveX, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor, formatTimeSlot, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

interface Reservation {
  id: string; status: string; archived: boolean; createdAt: Date
  formData: Record<string, string>
  user: { id: string; name: string; email: string; institution?: string | null; lab?: string | null }
  equipment: { id: string; name: string }
  timeSlot: { date: string; startTime: string; endTime: string }
}

interface Equipment { id: string; name: string }

type Action = 'CONFIRM' | 'REJECT' | 'COMPLETE' | 'NO_SHOW' | 'ARCHIVE' | 'UNARCHIVE'

const ARCHIVABLE_STATUSES = ['COMPLETED', 'CANCELLED', 'NO_SHOW']

export function AdminReservationsClient({
  reservations, equipment, currentStatus,
}: {
  reservations: Reservation[]
  equipment: Equipment[]
  currentStatus: string
}) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [tab, setTab] = useState(currentStatus === 'ARCHIVED' ? 'ARCHIVED' : currentStatus)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean; reservation: Reservation | null; action: Action | null
  }>({ open: false, reservation: null, action: null })
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const activeReservations = reservations.filter((r) => !r.archived)
  const archivedReservations = reservations.filter((r) => r.archived)

  const statusTabs = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

  const filtered =
    tab === 'ARCHIVED'
      ? archivedReservations
      : tab === 'ALL'
      ? activeReservations
      : activeReservations.filter((r) => r.status === tab)

  function openAction(reservation: Reservation, action: Action) {
    setActionDialog({ open: true, reservation, action })
    setAdminNote('')
  }

  async function executeAction() {
    if (!actionDialog.reservation || !actionDialog.action) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/reservations/${actionDialog.reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionDialog.action, adminNote }),
      })
      if (!res.ok) throw new Error()
      toast.success(lang === 'zh' ? '操作成功' : 'Action completed')
      setActionDialog({ open: false, reservation: null, action: null })
      router.refresh()
    } catch {
      toast.error(t.common.error)
    } finally {
      setProcessing(false)
    }
  }

  function handleExport() {
    const params = new URLSearchParams()
    if (tab === 'ARCHIVED') {
      params.set('archived', 'true')
    } else {
      if (tab !== 'ALL') params.set('status', tab)
    }
    window.location.href = `/api/admin/reservations/export?${params}`
  }

  const actionLabel = (action: Action) => {
    const map: Record<Action, string> = {
      CONFIRM: t.admin.approve,
      REJECT: t.admin.reject,
      COMPLETE: t.admin.complete,
      NO_SHOW: t.admin.noShow,
      ARCHIVE: lang === 'zh' ? '封存' : 'Archive',
      UNARCHIVE: lang === 'zh' ? '解除封存' : 'Unarchive',
    }
    return map[action]
  }

  const actionVariant = (action: Action): 'default' | 'destructive' | 'outline' => {
    if (action === 'CONFIRM' || action === 'COMPLETE') return 'default'
    if (action === 'REJECT' || action === 'NO_SHOW') return 'destructive'
    return 'outline'
  }

  const tabCount = (s: string) => {
    if (s === 'ARCHIVED') return archivedReservations.length
    if (s === 'ALL') return activeReservations.length
    return activeReservations.filter((r) => r.status === s).length
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{t.admin.reservations}</h1>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 text-xs">
          <Download className="h-3 w-3" />
          {lang === 'zh' ? '匯出 CSV' : 'Export CSV'}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {statusTabs.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {s === 'ALL' ? t.dashboard.filterAll : (t.reservation.status_label as Record<string, string>)[s]}
              <span className="ml-1 opacity-60">({tabCount(s)})</span>
            </TabsTrigger>
          ))}
          <TabsTrigger value="ARCHIVED" className="text-xs">
            {lang === 'zh' ? '封存' : 'Archived'}
            <span className="ml-1 opacity-60">({archivedReservations.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {lang === 'zh' ? '無預約紀錄' : 'No reservations'}
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {filtered.map((r) => (
                <Card key={r.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{r.user.name}</span>
                          {r.formData?.supervisor && (
                            <span className="text-xs text-muted-foreground">({r.formData.supervisor})</span>
                          )}
                          <span className="text-muted-foreground text-xs">{r.user.email}</span>
                          <Badge className={cn('text-xs', getStatusColor(r.status))}>
                            {(t.reservation.status_label as Record<string, string>)[r.status]}
                          </Badge>
                          {r.archived && (
                            <Badge variant="secondary" className="text-xs">
                              {lang === 'zh' ? '已封存' : 'Archived'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{r.equipment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.timeSlot.date} {formatTimeSlot(r.timeSlot.startTime, r.timeSlot.endTime)}
                          {r.user.institution && ` · ${r.user.institution}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt, lang)}</p>
                      </div>

                      <div className="flex flex-wrap gap-1 shrink-0">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/reservations/${r.id}`}><Eye className="h-3 w-3" /></Link>
                        </Button>
                        {r.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => openAction(r, 'CONFIRM')}>
                              <Check className="h-3 w-3 mr-1" />{t.admin.approve}
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => openAction(r, 'REJECT')}>
                              <X className="h-3 w-3 mr-1" />{t.admin.reject}
                            </Button>
                          </>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <>
                            <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => openAction(r, 'COMPLETE')}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />{t.admin.complete}
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => openAction(r, 'NO_SHOW')}>
                              <UserX className="h-3 w-3 mr-1" />{t.admin.noShow}
                            </Button>
                          </>
                        )}
                        {ARCHIVABLE_STATUSES.includes(r.status) && !r.archived && (
                          <Button size="sm" variant="outline" className="text-gray-500 border-gray-300" onClick={() => openAction(r, 'ARCHIVE')}>
                            <Archive className="h-3 w-3 mr-1" />
                            {lang === 'zh' ? '封存' : 'Archive'}
                          </Button>
                        )}
                        {r.archived && (
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-300" onClick={() => openAction(r, 'UNARCHIVE')}>
                            <ArchiveX className="h-3 w-3 mr-1" />
                            {lang === 'zh' ? '解封' : 'Unarchive'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={actionDialog.open} onOpenChange={(o) => setActionDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.action ? actionLabel(actionDialog.action) : ''}</DialogTitle>
            <DialogDescription>
              {actionDialog.reservation?.user.name} · {actionDialog.reservation?.equipment.name}
            </DialogDescription>
          </DialogHeader>
          {actionDialog.action !== 'ARCHIVE' && actionDialog.action !== 'UNARCHIVE' && (
            <div className="space-y-2">
              <Label>{t.admin.addNote}</Label>
              <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog((p) => ({ ...p, open: false }))}>
              {t.common.cancel}
            </Button>
            <Button
              variant={actionDialog.action ? actionVariant(actionDialog.action) : 'default'}
              onClick={executeAction}
              disabled={processing}
            >
              {t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
