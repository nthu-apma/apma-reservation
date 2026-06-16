'use client'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import type { FormField } from '@/types'

interface EquipmentDetailProps {
  equipment: {
    id: string; name: string; nameEn?: string | null
    description?: string | null; descriptionEn?: string | null
    notices?: string | null; noticesEn?: string | null
    category?: string | null; imageUrl?: string | null
    contactPerson?: string | null; contactEmail?: string | null; contactPhone?: string | null; contactLab?: string | null
    status: string; formFields: FormField[]
  }
}

export function EquipmentDetailClient({ equipment }: EquipmentDetailProps) {
  const { lang, t } = useLanguage()
  const { data: session } = useSession()

  const name = lang === 'zh' ? equipment.name : (equipment.nameEn || equipment.name)
  const description = lang === 'zh' ? equipment.description : (equipment.descriptionEn || equipment.description)
  const notices = lang === 'zh' ? equipment.notices : (equipment.noticesEn || equipment.notices)

  const statusLabel = { ACTIVE: lang === 'zh' ? '可諮詢' : 'Available', MAINTENANCE: lang === 'zh' ? '維護中' : 'Maintenance', INACTIVE: lang === 'zh' ? '暫停服務' : 'Inactive' }

  const hasContact = equipment.contactPerson || equipment.contactEmail || equipment.contactPhone || equipment.contactLab

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
          {hasContact && (
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
              {equipment.contactEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${equipment.contactEmail}`} className="text-primary hover:underline">
                    {equipment.contactEmail}
                  </a>
                </span>
              )}
              {equipment.contactPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:${equipment.contactPhone}`} className="text-primary hover:underline">
                    {equipment.contactPhone}
                  </a>
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
                <CardTitle className="text-base">{lang === 'zh' ? '諮詢申請需填寫的資訊' : 'Required Information for Consultation'}</CardTitle>
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
          {equipment.status === 'ACTIVE' && (
            <div className="space-y-2">
              {session ? (
                <Button className="w-full" asChild>
                  <Link href={`/booking/${equipment.id}`}>{lang === 'zh' ? '立即諮詢' : 'Consult Now'}</Link>
                </Button>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    {lang === 'zh' ? '請先登入再諮詢' : 'Please sign in to consult'}
                  </p>
                  <Button className="w-full" asChild>
                    <Link href={`/auth/login?callbackUrl=/booking/${equipment.id}`}>
                      {lang === 'zh' ? '登入並諮詢' : 'Sign In to Consult'}
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
