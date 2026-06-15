'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, formatTimeSlot } from '@/lib/utils'
import { toast } from 'sonner'
import { format, startOfMonth, addMonths, subMonths, getDay, getDaysInMonth } from 'date-fns'

interface Equipment { id: string; name: string }
interface Slot {
  id: string; date: string; startTime: string; endTime: string; available: boolean
  reservation: { status: string; user: { name: string } } | null
}

const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW_ZH = ['日', '一', '二', '三', '四', '五', '六']
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AdminTimeslotsClient({ equipment, selectedEquipmentId, slots }: {
  equipment: Equipment[]
  selectedEquipmentId: string
  slots: Slot[]
}) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()))
  const [addOpen, setAddOpen] = useState(false)
  const [addDate, setAddDate] = useState('')
  const [newSlots, setNewSlots] = useState([{ startTime: '09:00', endTime: '12:00' }])
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const slotMap = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    }
    return map
  }, [slots])

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDow = getDay(new Date(year, month, 1))
    const daysInMonth = getDaysInMonth(viewDate)
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewDate])

  function changeEquipment(id: string) {
    router.push(`/admin/timeslots?equipmentId=${id}`)
  }

  function openAdd(dateStr: string) {
    setAddDate(dateStr)
    setNewSlots([{ startTime: '09:00', endTime: '12:00' }])
    setAddOpen(true)
  }

  function updateRow(i: number, field: string, value: string) {
    setNewSlots((p) => p.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  async function saveSlots() {
    const valid = newSlots.filter((s) => s.startTime && s.endTime)
    if (!valid.length) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: selectedEquipmentId,
          slots: valid.map((s) => ({ date: addDate, ...s })),
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(lang === 'zh' ? `已新增 ${data.count} 個時段` : `Added ${data.count} slots`)
      setAddOpen(false)
      router.refresh()
    } catch {
      toast.error(t.common.error)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSlot() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/timeslots/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || t.common.error)
        return
      }
      toast.success(lang === 'zh' ? '已刪除' : 'Deleted')
      setDeleteId(null)
      router.refresh()
    } catch {
      toast.error(t.common.error)
    }
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const yr = viewDate.getFullYear()
  const mo = viewDate.getMonth()
  const monthLabel = lang === 'zh'
    ? `${yr}年 ${MONTHS_ZH[mo]}`
    : `${MONTHS_EN[mo]} ${yr}`
  const dowLabels = lang === 'zh' ? DOW_ZH : DOW_EN

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{t.admin.timeslots}</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Select value={selectedEquipmentId} onValueChange={changeEquipment}>
            <SelectTrigger>
              <SelectValue placeholder={lang === 'zh' ? '選擇設備' : 'Select equipment'} />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((eq) => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="icon" onClick={() => setViewDate(subMonths(viewDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-36 text-center select-none">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => setViewDate(addMonths(viewDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setViewDate(startOfMonth(new Date()))}>
            {lang === 'zh' ? '本月' : 'Today'}
          </Button>
        </div>
      </div>

      {!selectedEquipmentId ? (
        <div className="text-center py-16 text-muted-foreground">
          {lang === 'zh' ? '請選擇設備' : 'Please select equipment'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 bg-muted/40 border-b">
            {dowLabels.map((d, i) => (
              <div key={i} className={cn(
                'text-center text-xs font-medium py-2',
                i === 0 && 'text-red-500',
                i === 6 && 'text-blue-500',
              )}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarCells.map((day, idx) => {
              if (!day) {
                return <div key={idx} className="min-h-28 border-b border-r last:border-r-0 bg-gray-100 dark:bg-gray-800/40" />
              }
              const dateStr = format(new Date(yr, mo, day), 'yyyy-MM-dd')
              const daySlots = slotMap.get(dateStr) ?? []
              const isPast = dateStr < today
              const isToday = dateStr === today
              const dow = idx % 7

              return (
                <div
                  key={idx}
                  className={cn(
                    'group min-h-28 border-b border-r last:border-r-0 p-1.5 flex flex-col gap-1',
                    isPast ? 'bg-gray-100 dark:bg-gray-800/40' : 'hover:bg-accent/20 transition-colors',
                    isToday && 'ring-1 ring-inset ring-primary/40',
                  )}
                >
                  {/* Day number row */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      isToday && 'bg-primary text-primary-foreground',
                      !isToday && dow === 0 && 'text-red-500',
                      !isToday && dow === 6 && 'text-blue-500',
                    )}>
                      {day}
                    </span>
                    {!isPast && (
                      <button
                        onClick={() => openAdd(dateStr)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-0.5 rounded"
                        title={lang === 'zh' ? '新增時段' : 'Add slot'}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Slots */}
                  <div className="flex flex-col gap-0.5 flex-1">
                    {daySlots.map((slot) => {
                      const isBooked = slot.reservation && slot.reservation.status !== 'CANCELLED'
                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            'flex items-center gap-1 text-[10px] leading-tight px-1.5 py-0.5 rounded',
                            isBooked
                              ? 'bg-gray-200 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                          )}
                        >
                          <span className="flex-1 min-w-0 truncate">
                            {formatTimeSlot(slot.startTime, slot.endTime)}
                            {isBooked && (
                              <span className="opacity-70"> · {slot.reservation?.user.name}</span>
                            )}
                          </span>
                          {!isBooked && !isPast && (
                            <button
                              onClick={() => setDeleteId(slot.id)}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/50 inline-block" />
          {lang === 'zh' ? '可預約' : 'Available'}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-700 inline-block" />
          {lang === 'zh' ? '已預約' : 'Booked'}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800/40 inline-block border" />
          {lang === 'zh' ? '過去日期' : 'Past'}
        </div>
      </div>

      {/* Add slots dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {lang === 'zh' ? `新增時段` : 'Add Slots'}
              <span className="ml-2 text-sm font-normal text-muted-foreground">{addDate}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {newSlots.map((slot, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">{lang === 'zh' ? '開始' : 'Start'}</Label>
                  <Input type="time" value={slot.startTime} onChange={(e) => updateRow(i, 'startTime', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{lang === 'zh' ? '結束' : 'End'}</Label>
                  <Input type="time" value={slot.endTime} onChange={(e) => updateRow(i, 'endTime', e.target.value)} />
                </div>
                {newSlots.length > 1 && (
                  <Button
                    variant="ghost" size="icon" className="h-10 w-10 shrink-0"
                    onClick={() => setNewSlots((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline" size="sm" className="w-full"
            onClick={() => setNewSlots((p) => [...p, { startTime: '09:00', endTime: '12:00' }])}
          >
            <Plus className="h-3 w-3 mr-1" />{lang === 'zh' ? '再加一行' : 'Add Row'}
          </Button>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={saveSlots} disabled={saving}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '確認刪除此時段？' : 'Delete this slot?'}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={deleteSlot}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
