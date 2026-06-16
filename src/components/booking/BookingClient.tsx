'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardList, Phone, Mail, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { FormField } from '@/types'

interface Equipment {
  id: string; name: string; nameEn?: string | null
  contactPerson?: string | null; contactEmail?: string | null; contactPhone?: string | null; contactLab?: string | null
  formFields: FormField[]
}

export function BookingClient({ equipment }: { equipment: Equipment }) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function isVisible(field: FormField, data: Record<string, string>): boolean {
    if (!field.conditionalOn) return true
    return data[field.conditionalOn] === field.conditionalValue
  }

  async function handleFileUpload(fieldId: string, file: File) {
    setUploading((p) => ({ ...p, [fieldId]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setFormData((p) => ({ ...p, [fieldId]: data.url }))
      toast.success(lang === 'zh' ? '上傳成功' : 'Uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (lang === 'zh' ? '上傳失敗' : 'Upload failed'))
    } finally {
      setUploading((p) => ({ ...p, [fieldId]: false }))
    }
  }

  const name = lang === 'zh' ? equipment.name : (equipment.nameEn || equipment.name)

  async function handleSubmit() {
    const missing = equipment.formFields.filter(
      (f) => f.required && isVisible(f, formData) && !formData[f.id]?.trim()
    )
    if (missing.length > 0) {
      toast.error(lang === 'zh' ? '請填寫所有必填欄位' : 'Please fill in all required fields')
      return
    }

    const visibleFormData: Record<string, string> = {}
    for (const field of equipment.formFields) {
      if (isVisible(field, formData) && formData[field.id]) {
        visibleFormData[field.id] = formData[field.id]
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: equipment.id, formData: visibleFormData }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || t.common.error)
        return
      }
      setDone(true)
    } catch {
      toast.error(t.common.error)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="container py-16 max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-3">{lang === 'zh' ? '諮詢申請已送出' : 'Consultation Submitted'}</h1>
        <p className="text-muted-foreground mb-8">
          {lang === 'zh' ? '申請已成功送出，設備管理員將盡快與您聯繫。' : 'Your request has been submitted. The equipment admin will contact you soon.'}
        </p>
        <Button asChild>
          <Link href="/dashboard">{lang === 'zh' ? '查看我的申請' : 'View My Requests'}</Link>
        </Button>
      </div>
    )
  }

  const steps = [
    { num: 1, label: lang === 'zh' ? '聯絡資訊' : 'Contact Info', icon: Phone },
    { num: 2, label: lang === 'zh' ? '填寫申請表' : 'Application Form', icon: ClipboardList },
  ]

  return (
    <div className="container py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href={`/equipment/${equipment.id}`}><ArrowLeft className="mr-2 h-4 w-4" />{t.common.back}</Link>
      </Button>

      <h1 className="text-xl font-bold mb-2">{lang === 'zh' ? '立即諮詢' : 'Consultation Request'}</h1>
      <p className="text-muted-foreground mb-6">{name}</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
              step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {s.num}
            </div>
            <span className={cn('text-sm hidden sm:block', step >= s.num ? 'text-foreground' : 'text-muted-foreground')}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn('h-px w-8 mx-2', step > s.num ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Contact info */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {lang === 'zh' ? '設備負責人聯絡資訊' : 'Equipment Contact Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipment.contactPerson && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">{lang === 'zh' ? '負責人' : 'Contact'}</span>
                  <span className="font-medium">{equipment.contactPerson}</span>
                </div>
              )}
              {equipment.contactLab && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">{lang === 'zh' ? '實驗室' : 'Lab'}</span>
                  <span>{equipment.contactLab}</span>
                </div>
              )}
              {equipment.contactEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${equipment.contactEmail}`} className="text-primary hover:underline">
                    {equipment.contactEmail}
                  </a>
                </div>
              )}
              {equipment.contactPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${equipment.contactPhone}`} className="text-primary hover:underline">
                    {equipment.contactPhone}
                  </a>
                </div>
              )}
              {!equipment.contactEmail && !equipment.contactPhone && !equipment.contactPerson && (
                <p className="text-sm text-muted-foreground">
                  {lang === 'zh' ? '請透過下方申請表提交需求，管理員將主動聯繫您。' : 'Please submit the form below. The admin will contact you.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">
                {lang === 'zh'
                  ? '您可以透過上方聯絡資訊直接與設備管理員溝通，或填寫下方申請表送出正式諮詢申請。'
                  : 'You may contact the equipment admin directly above, or submit a formal consultation request via the form below.'}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>
              {lang === 'zh' ? '填寫申請表' : 'Fill Application Form'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Fill form */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{lang === 'zh' ? '諮詢申請表' : 'Consultation Form'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipment.formFields.map((field) => {
                if (!isVisible(field, formData)) return null
                const label = lang === 'zh' ? field.label : (field.labelEn || field.label)
                const placeholder = lang === 'zh' ? field.placeholder : (field.placeholderEn || field.placeholder)
                const hint = lang === 'zh' ? field.hint : (field.hintEn || field.hint)

                return (
                  <div key={field.id} className="space-y-1.5">
                    <Label>
                      {label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea placeholder={placeholder} value={formData[field.id] || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.id]: e.target.value }))} />
                    ) : field.type === 'select' ? (
                      <Select value={formData[field.id] || ''} onValueChange={(v) => setFormData((p) => ({ ...p, [field.id]: v }))}>
                        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt, idx) => {
                            const display = lang === 'zh' ? opt : (field.optionsEn?.[idx] ?? opt)
                            return <SelectItem key={opt} value={opt}>{display}</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'file' ? (
                      <div className="space-y-2">
                        {formData[field.id] ? (
                          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/40">
                            {formData[field.id].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={formData[field.id]} alt="uploaded" className="h-16 w-auto rounded object-contain" />
                            ) : (
                              <span className="text-xs text-muted-foreground truncate flex-1">{formData[field.id]}</span>
                            )}
                            <button type="button" onClick={() => setFormData((p) => ({ ...p, [field.id]: '' }))}
                              className="text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className={cn(
                            'flex items-center gap-2 px-3 py-2 border border-dashed rounded-md cursor-pointer text-sm text-muted-foreground hover:bg-accent transition-colors',
                            uploading[field.id] && 'opacity-50 cursor-not-allowed'
                          )}>
                            <Upload className="h-4 w-4" />
                            <span>{uploading[field.id] ? (lang === 'zh' ? '上傳中...' : 'Uploading...') : (lang === 'zh' ? '點擊上傳圖片或 PDF' : 'Click to upload image or PDF')}</span>
                            <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploading[field.id]}
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(field.id, f) }} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <Input type={field.type} placeholder={placeholder} value={formData[field.id] || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.id]: e.target.value }))} />
                    )}
                    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {lang === 'zh' ? '上一步' : 'Back'}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (lang === 'zh' ? '送出中...' : 'Submitting...') : (lang === 'zh' ? '送出申請' : 'Submit Request')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
