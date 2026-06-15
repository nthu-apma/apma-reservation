'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, User, FlaskConical, MessageSquare, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor, formatDateTime, formatTimeSlot } from '@/lib/utils'
import { toast } from 'sonner'
import type { FormField } from '@/types'

interface Note { id: string; content: string; createdAt: Date; author: { id: string; name: string; role: string } }
interface Reservation {
  id: string; status: string; formData: Record<string, string>
  adminNote?: string | null; cancelReason?: string | null
  createdAt: Date; updatedAt: Date
  user: { id: string; name: string; email: string; institution?: string | null; lab?: string | null }
  equipment: { id: string; name: string; nameEn?: string | null; formFields: FormField[] }
  timeSlot: { date: string; startTime: string; endTime: string }
  notes: Note[]
}

export function ReservationDetailClient({
  reservation, currentUserId, currentUserRole,
}: {
  reservation: Reservation
  currentUserId: string
  currentUserRole: string
}) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>(reservation.notes)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const isOwner = reservation.user.id === currentUserId
  const isStaff = ['ADMIN', 'ASSISTANT'].includes(currentUserRole)
  const canCancel = isOwner && ['PENDING', 'CONFIRMED'].includes(reservation.status)

  const eqName = lang === 'zh' ? reservation.equipment.name : (reservation.equipment.nameEn || reservation.equipment.name)

  const displayStatus = (!isStaff && reservation.status === 'NO_SHOW') ? 'CANCELLED' : reservation.status

  async function addNote() {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText }),
      })
      if (!res.ok) throw new Error()
      const note = await res.json()
      setNotes((prev) => [...prev, note])
      setNoteText('')
      toast.success(lang === 'zh' ? '筆記已新增' : 'Note added')
    } catch {
      toast.error(t.common.error)
    } finally {
      setAddingNote(false)
    }
  }

  async function cancelReservation() {
    setCancelling(true)
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason }),
      })
      if (!res.ok) throw new Error()
      toast.success(lang === 'zh' ? '預約已取消' : 'Reservation cancelled')
      setCancelOpen(false)
      router.refresh()
    } catch {
      toast.error(t.common.error)
    } finally {
      setCancelling(false)
    }
  }

  const roleLabel = (role: string) => {
    return (t.admin.role as Record<string, string>)[role] || role
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />{t.common.back}</Link>
      </Button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">{eqName}</h1>
          <p className="text-xs text-muted-foreground mt-1">ID: {reservation.id}</p>
        </div>
        <Badge className={cn('shrink-0', getStatusColor(displayStatus))}>
          {(t.reservation.status_label as Record<string, string>)[displayStatus]}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        {/* Basic info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{lang === 'zh' ? '預約資訊' : 'Booking Info'}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{reservation.timeSlot.date} {formatTimeSlot(reservation.timeSlot.startTime, reservation.timeSlot.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{reservation.user.name}</span>
            </div>
            {reservation.user.institution && (
              <p className="text-muted-foreground text-xs pl-6">{reservation.user.institution}</p>
            )}
            {reservation.user.lab && (
              <p className="text-muted-foreground text-xs pl-6">{reservation.user.lab}</p>
            )}
          </CardContent>
        </Card>

        {/* Status info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{lang === 'zh' ? '狀態資訊' : 'Status Info'}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground text-xs">
              {lang === 'zh' ? '申請時間：' : 'Submitted: '}{formatDateTime(reservation.createdAt, lang)}
            </p>
            <p className="text-muted-foreground text-xs">
              {lang === 'zh' ? '更新時間：' : 'Updated: '}{formatDateTime(reservation.updatedAt, lang)}
            </p>
            {isStaff && reservation.adminNote && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">{t.reservation.adminNote}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">{reservation.adminNote}</p>
              </div>
            )}
            {reservation.cancelReason && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
                <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">{t.reservation.cancelReason}</p>
                <p className="text-xs text-red-700 dark:text-red-400">{reservation.cancelReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form data */}
      {reservation.equipment.formFields.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t.reservation.formData}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {reservation.equipment.formFields.map((field) => {
                const label = lang === 'zh' ? field.label : (field.labelEn || field.label)
                const value = reservation.formData[field.id]
                if (!value) return null
                if (field.conditionalOn && reservation.formData[field.conditionalOn] !== field.conditionalValue) return null
                const isImage = field.type === 'file' && value.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                const isFileUrl = field.type === 'file'
                return (
                  <div key={field.id} className={field.type === 'file' ? 'col-span-2' : ''}>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    {isImage ? (
                      <img src={value} alt={label} className="max-h-48 rounded border object-contain" />
                    ) : isFileUrl ? (
                      <a href={value} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all">{value}</a>
                    ) : (
                      <p className="text-sm font-medium whitespace-pre-line">{value}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t.notes.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t.notes.noNotes}</p>
          ) : (
            <div className="space-y-4 mb-4">
              {notes.map((note) => (
                <div key={note.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{note.author.name}</span>
                    <Badge variant="outline" className="text-xs">{roleLabel(note.author.role)}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt, lang)}</span>
                  </div>
                  <p className="text-sm bg-muted/50 rounded p-2 whitespace-pre-line">{note.content}</p>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label className="text-xs">{t.notes.addNote}</Label>
            <Textarea
              placeholder={t.notes.placeholder}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <Button size="sm" onClick={addNote} disabled={addingNote || !noteText.trim()}>
              <Send className="h-3 w-3 mr-1" />
              {t.notes.submit}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel button */}
      {canCancel && (
        <div className="mt-4 flex justify-end">
          <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
            <Trash2 className="h-3 w-3 mr-1" />
            {t.reservation.cancel}
          </Button>
        </div>
      )}

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reservation.cancelConfirm}</DialogTitle>
            <DialogDescription>{eqName} · {reservation.timeSlot.date}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t.reservation.cancelReasonLabel}</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={cancelReservation} disabled={cancelling}>
              {t.reservation.confirmCancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
