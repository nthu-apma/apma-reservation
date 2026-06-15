'use client'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, AlertCircle, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import type { FormField } from '@/types'

interface TimeSlot { id: string; date: string; startTime: string; endTime: string }

interface EquipmentDetailProps {
  equipment: {
    id: string; name: string; nameEn?: string | null
    description?: string | null; descriptionEn?: string | null
    notices?: string | null; noticesEn?: string | null
    category?: string | null; imageUrl?: string | null
    contactPerson?: string | null; contactLab?: string | null
    status: string; formFields: FormField[]
  }
  timeSlots: TimeSlot[]
}

export function EquipmentDetailClient({ equipment, timeSlots }: EquipmentDetailProps) {
  const { lang, t } = useLanguage()
  const { data: session } = useSession()

  const name = lang === 'zh' ? equipment.name : (equipment.nameEn || equipment.name)
  const description = lang === 'zh' ? equipment.description : (equipment.descriptionEn || equipment.description)
  const notices = lang === 'zh' ? equipment.notices : (equipment.noticesEn || equipment.notices)

  const statusLabel = { ACTIVE: lang === 'zh' ? '可預約' : 'Available', MAINTENANCE: lang === 'zh' ? '維護中' : 'Maintenance', INACTIVE: lang === 'zh' ? '暫停服務' : 'Inactive' }

  const uniqueDates = Array.from(new Set(timeSlots.map((s) => s.date))).slice(0, 10)

  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />{t.common.back}</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {equipment.category && (
                <span className="text-xs text-muted-foreground mb-1 block">{equipment.category}</span>
              )}
              <h1 className="text-2xl font-bold">{name}</h1>
            </div>
            <Badge className={cn('shrink-0', getStatusColor(equipment.status))}>
              {(statusLabel as Record<string, string>)[equipment.status]}
            </Badge>
          </div>

          {/* Contact info */}
          {(equipment.contactPerson || equipment.contactLab) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {equipment.contactPerson && (
                <span>
                  <span className="font-medium text-foreground">{lang === 'zh' ? '負責人：' : 'Contact: '}</span>
                  {equipment.contactPerson}
                </span>
              )}
              {equipment.contactLab && (
                <span>
                  <span className="font-medium text-foreground">{lang === 'zh' ? '負責實驗室：' : 'Lab: '}</span>
                  {equipment.contactLab}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{lang === 'zh' ? '設備說明' : 'Description'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
              </CardContent>
            </Card>
          )}

          {/* Notices */}
          {notices && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  {t.equipment.notices}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 whitespace-pre-line">{notices}</p>
              </CardContent>
            </Card>
          )}

          {/* Form fields preview */}
          {equipment.formFields.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{lang === 'zh' ? '預約時需填寫的資訊' : 'Required Information for Booking'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {equipment.formFields.map((field) => (
                    <li key={field.id} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{lang === 'zh' ? field.label : (field.labelEn || field.label)}</span>
                      {field.required && (
                        <span className="text-xs text-destructive">*</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {lang === 'zh' ? '近期可用時段' : 'Upcoming Slots'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uniqueDates.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.booking.noAvailableDates}</p>
              ) : (
                <div className="space-y-2">
                  {uniqueDates.map((date) => (
                    <div key={date} className="text-sm">
                      <span className="font-medium">{date}</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {timeSlots.filter((s) => s.date === date).map((slot) => (
                          <span key={slot.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {slot.startTime}–{slot.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {equipment.status === 'ACTIVE' && (
            <div className="space-y-2">
              {session ? (
                <Button className="w-full" asChild>
                  <Link href={`/booking/${equipment.id}`}>{t.equipment.bookNow}</Link>
                </Button>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    {lang === 'zh' ? '請先登入再預約' : 'Please sign in to book'}
                  </p>
                  <Button className="w-full" asChild>
                    <Link href={`/auth/login?callbackUrl=/booking/${equipment.id}`}>
                      {lang === 'zh' ? '登入並預約' : 'Sign In to Book'}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
