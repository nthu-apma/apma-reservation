'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, FlaskConical, GripVertical, ChevronUp, ChevronDown, Settings2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor } from '@/lib/utils'
import { toast } from 'sonner'
import type { FormField } from '@/types'

interface Equipment {
  id: string; name: string; nameEn?: string | null
  description?: string | null; descriptionEn?: string | null
  notices?: string | null; noticesEn?: string | null
  category?: string | null; imageUrl?: string | null
  contactPerson?: string | null; contactLab?: string | null
  status: string; formFields: FormField[]; order: number
}

const FIELD_TYPES: { value: FormField['type']; labelZh: string; labelEn: string }[] = [
  { value: 'text',     labelZh: '單行文字',   labelEn: 'Text' },
  { value: 'textarea', labelZh: '多行文字',   labelEn: 'Textarea' },
  { value: 'select',   labelZh: '下拉選單',   labelEn: 'Select' },
  { value: 'number',   labelZh: '數字',       labelEn: 'Number' },
  { value: 'url',      labelZh: '網址連結',   labelEn: 'URL' },
  { value: 'file',     labelZh: '圖片/檔案上傳', labelEn: 'File Upload' },
]

const emptyEquipment = {
  name: '', nameEn: '', description: '', descriptionEn: '',
  notices: '', noticesEn: '', category: '', imageUrl: '',
  contactPerson: '', contactLab: '',
  status: 'ACTIVE', formFields: [] as FormField[], order: 0,
}

interface FieldForm {
  id: string; label: string; labelEn: string; type: FormField['type']
  required: boolean; placeholder: string; placeholderEn: string
  hint: string; hintEn: string; options: string[]; optionsEn: string[]
  conditionalOn: string; conditionalValue: string
}

const emptyField: FieldForm = {
  id: '', label: '', labelEn: '', type: 'text', required: true,
  placeholder: '', placeholderEn: '', hint: '', hintEn: '',
  options: [], optionsEn: [], conditionalOn: '', conditionalValue: '',
}

function toFieldId(labelEn: string, label: string): string {
  const base = labelEn || label
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return slug || `field_${Math.random().toString(36).slice(2, 8)}`
}

function ensureUniqueId(id: string, existing: FormField[], excludeId?: string): string {
  const others = existing.filter((f) => f.id !== excludeId)
  if (!others.find((f) => f.id === id)) return id
  let i = 2
  while (others.find((f) => f.id === `${id}_${i}`)) i++
  return `${id}_${i}`
}

// ─── Field Guide Dialog ────────────────────────────────────────────────────
function FieldGuideDialog({ open, onOpenChange, lang }: { open: boolean; onOpenChange: (v: boolean) => void; lang: 'zh' | 'en' }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang === 'zh' ? '表單欄位編輯器使用說明' : 'Form Field Editor Guide'}</DialogTitle>
          <DialogDescription>{lang === 'zh' ? '新增設備時，如何設定預約表單的填寫欄位' : 'How to configure booking form fields for equipment'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">

          {/* Section: Field types */}
          <div className="space-y-2">
            <p className="font-semibold">{lang === 'zh' ? '欄位類型說明' : 'Field Types'}</p>
            <div className="space-y-1.5 text-muted-foreground">
              {[
                { type: '單行文字', typeEn: 'Text', zh: '適合簡短輸入，如：樣品名稱、波長數值', en: 'Short input — e.g., sample name, wavelength' },
                { type: '多行文字', typeEn: 'Textarea', zh: '適合較長的說明，如：樣品詳細描述', en: 'Long input — e.g., detailed sample description' },
                { type: '下拉選單', typeEn: 'Select', zh: '使用者從預設選項中選擇，需填寫「選項」欄位（每行一個）', en: 'User picks from preset options — fill in the Options field (one per line)' },
                { type: '數字', typeEn: 'Number', zh: '僅接受數字輸入', en: 'Accepts numeric input only' },
                { type: '網址連結', typeEn: 'URL', zh: '使用者輸入網址，如：文獻 DOI 連結', en: 'URL input — e.g., DOI link' },
                { type: '圖片/檔案上傳', typeEn: 'File Upload', zh: '使用者上傳圖片或 PDF（最大 10 MB）', en: 'Upload image or PDF (max 10 MB)' },
              ].map((row) => (
                <div key={row.type} className="grid grid-cols-[6rem_1fr] gap-2 text-xs">
                  <Badge variant="secondary" className="justify-center h-fit">{lang === 'zh' ? row.type : row.typeEn}</Badge>
                  <span>{lang === 'zh' ? row.zh : row.en}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t" />

          {/* Section: Conditional display */}
          <div className="space-y-2">
            <p className="font-semibold">{lang === 'zh' ? '條件顯示' : 'Conditional Display'}</p>
            <p className="text-muted-foreground text-xs">
              {lang === 'zh'
                ? '可以讓某個欄位只在另一個欄位選了特定值時才顯示。例如：「樣品狀態」選「其他」時，才顯示「其他說明」文字框。'
                : 'A field can be shown only when another field has a specific value. E.g., show "Other description" only when "Sample State" = "Other".'}
            </p>
            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-xs">
              <p className="font-medium">{lang === 'zh' ? '設定步驟：' : 'Setup steps:'}</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>{lang === 'zh' ? '在「依賴欄位 ID」填入觸發條件的欄位 ID（可在欄位列表中看到每個欄位的 ID）' : 'In "Depends on Field ID", enter the ID of the trigger field (visible in the field list)'}</li>
                <li>{lang === 'zh' ? '在「觸發顯示的值」填入哪個選項會讓此欄位出現' : 'In "Show when value equals", enter the option that triggers this field'}</li>
              </ol>
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  {lang === 'zh' ? '⚠️ 重要：觸發值必須使用中文選項原文' : '⚠️ Important: use the Chinese option text as the trigger value'}
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  {lang === 'zh'
                    ? '例如「樣品狀態」的選項是「其他 (Other)」，觸發值就要填「其他 (Other)」（完整中文文字），而不是「Other」'
                    : 'E.g., if the option is "其他 (Other)", enter "其他 (Other)" as the trigger value — not "Other"'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Section: Field ID */}
          <div className="space-y-2">
            <p className="font-semibold">{lang === 'zh' ? '欄位 ID' : 'Field ID'}</p>
            <p className="text-muted-foreground text-xs">
              {lang === 'zh'
                ? '欄位 ID 是系統內部識別用的英文代號，系統會根據英文標籤自動產生。如果需要用於「條件顯示」的依賴關係，請記下 ID 後再設定條件欄位。'
                : 'Field ID is the internal key, auto-generated from the English label. Note the ID when setting up conditional fields that depend on it.'}
            </p>
            <p className="text-muted-foreground text-xs">
              {lang === 'zh' ? '⚠️ 欄位儲存後請勿修改 ID，否則已提交的預約資料將無法正確顯示。' : '⚠️ Do not change IDs after saving — existing reservation data references them.'}
            </p>
          </div>

          <div className="border-t" />

          {/* Section: Required vs optional */}
          <div className="space-y-2">
            <p className="font-semibold">{lang === 'zh' ? '必填 / 選填' : 'Required / Optional'}</p>
            <p className="text-muted-foreground text-xs">
              {lang === 'zh'
                ? '條件顯示的欄位若標記為「必填」，只有在欄位實際顯示時才會驗證。隱藏時不強制填寫。'
                : 'Conditional fields marked "Required" are only validated when visible — hidden fields are never required.'}
            </p>
          </div>

        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{lang === 'zh' ? '了解了' : 'Got it'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Field Editor Dialog ───────────────────────────────────────────────────
function FieldEditorDialog({
  open, onOpenChange, field, existingFields, onSave, lang,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  field: FieldForm | null
  existingFields: FormField[]
  onSave: (f: FormField) => void
  lang: 'zh' | 'en'
}) {
  const isNew = !field?.id || !existingFields.find((f) => f.id === field.id)
  const [form, setForm] = useState<FieldForm>(field ?? { ...emptyField })
  const [optionsText, setOptionsText] = useState(field?.options?.join('\n') ?? '')
  const [optionsEnText, setOptionsEnText] = useState(field?.optionsEn?.join('\n') ?? '')

  // Re-sync when dialog reopens with a different field
  const [lastField, setLastField] = useState<FieldForm | null>(field)
  if (field !== lastField) {
    setLastField(field)
    setForm(field ?? { ...emptyField })
    setOptionsText(field?.options?.join('\n') ?? '')
    setOptionsEnText(field?.optionsEn?.join('\n') ?? '')
  }

  function set<K extends keyof FieldForm>(k: K, v: FieldForm[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleSave() {
    if (!form.label.trim()) {
      toast.error(lang === 'zh' ? '請填寫欄位標籤（中文）' : 'Please fill in field label')
      return
    }
    const baseId = form.id.trim() || toFieldId(form.labelEn, form.label)
    const finalId = ensureUniqueId(baseId, existingFields, isNew ? undefined : form.id)
    const saved: FormField = {
      id: finalId,
      label: form.label.trim(),
      labelEn: form.labelEn.trim() || undefined,
      type: form.type,
      required: form.required,
      placeholder: form.placeholder.trim() || undefined,
      placeholderEn: form.placeholderEn.trim() || undefined,
      hint: form.hint.trim() || undefined,
      hintEn: form.hintEn.trim() || undefined,
      options: form.type === 'select' ? optionsText.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
      optionsEn: form.type === 'select' ? optionsEnText.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
      conditionalOn: form.conditionalOn.trim() || undefined,
      conditionalValue: form.conditionalValue.trim() || undefined,
    }
    onSave(saved)
    onOpenChange(false)
  }

  const typeLabel = (v: FormField['type']) =>
    FIELD_TYPES.find((t) => t.value === v)?.[lang === 'zh' ? 'labelZh' : 'labelEn'] ?? v

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang === 'zh' ? (isNew ? '新增表單欄位' : '編輯表單欄位') : (isNew ? 'Add Form Field' : 'Edit Form Field')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Labels */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '標籤（中文）' : 'Label (Chinese)'} <span className="text-destructive">*</span></Label>
              <Input value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="例：樣品名稱" />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '標籤（英文）' : 'Label (English)'}</Label>
              <Input value={form.labelEn} onChange={(e) => set('labelEn', e.target.value)} placeholder="e.g., Sample Name" />
            </div>
          </div>

          {/* Type + Required */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '欄位類型' : 'Field Type'}</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v as FormField['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {lang === 'zh' ? t.labelZh : t.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '必填' : 'Required'}</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={form.required} onCheckedChange={(v) => set('required', v)} />
                <span className="text-sm text-muted-foreground">{form.required ? (lang === 'zh' ? '必填' : 'Required') : (lang === 'zh' ? '選填' : 'Optional')}</span>
              </div>
            </div>
          </div>

          {/* Placeholder — not for file/select */}
          {!['file', 'select'].includes(form.type) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? 'Placeholder（中文）' : 'Placeholder (Chinese)'}</Label>
                <Input value={form.placeholder} onChange={(e) => set('placeholder', e.target.value)} placeholder="例：請輸入..." />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? 'Placeholder（英文）' : 'Placeholder (English)'}</Label>
                <Input value={form.placeholderEn} onChange={(e) => set('placeholderEn', e.target.value)} placeholder="e.g., Enter..." />
              </div>
            </div>
          )}

          {/* Options — only for select */}
          {form.type === 'select' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '選項（中文，每行一個）' : 'Options (Chinese, one per line)'}</Label>
                <Textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={4} placeholder={'選項一\n選項二\n選項三'} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '選項（英文，每行一個）' : 'Options (English, one per line)'}</Label>
                <Textarea value={optionsEnText} onChange={(e) => setOptionsEnText(e.target.value)} rows={4} placeholder={'Option A\nOption B\nOption C'} />
              </div>
            </div>
          )}

          {/* Hint */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '提示文字（中文）' : 'Hint (Chinese)'}</Label>
              <Input value={form.hint} onChange={(e) => set('hint', e.target.value)} placeholder="例：請確認數值範圍..." />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '提示文字（英文）' : 'Hint (English)'}</Label>
              <Input value={form.hintEn} onChange={(e) => set('hintEn', e.target.value)} placeholder="e.g., Please confirm the range..." />
            </div>
          </div>

          {/* Conditional display */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-xs font-medium text-muted-foreground">
              {lang === 'zh' ? '條件顯示（選填）' : 'Conditional Display (optional)'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{lang === 'zh' ? '依賴欄位 ID' : 'Depends on Field ID'}</Label>
                <Input
                  value={form.conditionalOn}
                  onChange={(e) => set('conditionalOn', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+/, ''))}
                  placeholder="e.g., sample_state"
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{lang === 'zh' ? '觸發顯示的值' : 'Show when value equals'}</Label>
                <Input
                  value={form.conditionalValue}
                  onChange={(e) => set('conditionalValue', e.target.value)}
                  placeholder={lang === 'zh' ? '例：其他 (Other)' : 'e.g., Other'}
                  className="text-xs"
                />
              </div>
            </div>
            {form.conditionalOn && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {lang === 'zh'
                  ? `此欄位只在「${form.conditionalOn}」= 「${form.conditionalValue || '(未設定)'}」時顯示`
                  : `Shown only when "${form.conditionalOn}" = "${form.conditionalValue || '(not set)'}"` }
              </p>
            )}
            {existingFields.filter((f) => f.id !== form.id).length > 0 && (
              <p className="text-xs text-muted-foreground">
                {lang === 'zh' ? '可用欄位 ID：' : 'Available IDs: '}
                <span className="font-mono">{existingFields.filter((f) => f.id !== form.id).map((f) => f.id).join(', ')}</span>
              </p>
            )}
          </div>

          {/* Advanced: Field ID */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">{lang === 'zh' ? '欄位 ID（選填，系統自動產生）' : 'Field ID (optional, auto-generated)'}</Label>
            <Input value={form.id} onChange={(e) => set('id', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              placeholder={toFieldId(form.labelEn, form.label) || 'auto'} className="text-xs font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang === 'zh' ? '取消' : 'Cancel'}</Button>
          <Button onClick={handleSave}>{lang === 'zh' ? '儲存欄位' : 'Save Field'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
export function AdminEquipmentClient({ equipment }: { equipment: Equipment[] }) {
  const { lang, t } = useLanguage()
  const router = useRouter()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [form, setForm] = useState(emptyEquipment)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Field editor state
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<FieldForm | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function setF<K extends keyof typeof emptyEquipment>(k: K, v: typeof emptyEquipment[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyEquipment)
    setDialogOpen(true)
  }

  function openEdit(eq: Equipment) {
    setEditing(eq)
    setForm({
      name: eq.name, nameEn: eq.nameEn ?? '',
      description: eq.description ?? '', descriptionEn: eq.descriptionEn ?? '',
      notices: eq.notices ?? '', noticesEn: eq.noticesEn ?? '',
      category: eq.category ?? '', imageUrl: eq.imageUrl ?? '',
      contactPerson: eq.contactPerson ?? '', contactLab: eq.contactLab ?? '',
      status: eq.status, formFields: eq.formFields, order: eq.order,
    })
    setDialogOpen(true)
  }

  function openAddField() {
    setEditingField({ ...emptyField })
    setFieldDialogOpen(true)
  }

  function openEditField(field: FormField) {
    setEditingField({
      id: field.id, label: field.label, labelEn: field.labelEn ?? '',
      type: field.type, required: field.required,
      placeholder: field.placeholder ?? '', placeholderEn: field.placeholderEn ?? '',
      hint: field.hint ?? '', hintEn: field.hintEn ?? '',
      options: field.options ?? [], optionsEn: field.optionsEn ?? [],
      conditionalOn: field.conditionalOn ?? '', conditionalValue: field.conditionalValue ?? '',
    })
    setFieldDialogOpen(true)
  }

  function handleFieldSave(saved: FormField) {
    const exists = form.formFields.find((f) => f.id === saved.id)
    if (exists) {
      setF('formFields', form.formFields.map((f) => f.id === saved.id ? saved : f))
    } else {
      setF('formFields', [...form.formFields, saved])
    }
  }

  function deleteField(id: string) {
    setF('formFields', form.formFields.filter((f) => f.id !== id))
  }

  function moveField(index: number, direction: -1 | 1) {
    const arr = [...form.formFields]
    const target = index + direction
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    setF('formFields', arr)
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== toIndex) {
      const arr = [...form.formFields]
      const [moved] = arr.splice(dragIndex, 1)
      arr.splice(toIndex, 0, moved)
      setF('formFields', arr)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  async function save() {
    setSaving(true)
    try {
      const url = editing ? `/api/admin/equipment/${editing.id}` : '/api/admin/equipment'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(lang === 'zh' ? '儲存成功' : 'Saved')
      setDialogOpen(false)
      router.refresh()
    } catch {
      toast.error(t.common.error)
    } finally {
      setSaving(false)
    }
  }

  async function deleteEquipment() {
    if (!deleteId) return
    try {
      await fetch(`/api/admin/equipment/${deleteId}`, { method: 'DELETE' })
      toast.success(lang === 'zh' ? '已刪除' : 'Deleted')
      setDeleteId(null)
      router.refresh()
    } catch {
      toast.error(t.common.error)
    }
  }

  const statusLabel = {
    ACTIVE: lang === 'zh' ? '可預約' : 'Active',
    MAINTENANCE: lang === 'zh' ? '維護中' : 'Maintenance',
    INACTIVE: lang === 'zh' ? '暫停' : 'Inactive',
  }

  const fieldTypeLabel = (type: FormField['type']) =>
    FIELD_TYPES.find((t) => t.value === type)?.[lang === 'zh' ? 'labelZh' : 'labelEn'] ?? type

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.admin.equipment}</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />{t.admin.addEquipment}
        </Button>
      </div>

      {/* Equipment list */}
      {equipment.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{lang === 'zh' ? '尚無設備，請新增' : 'No equipment yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {equipment.map((eq) => (
            <Card key={eq.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{eq.name}</span>
                      <Badge className={cn('text-xs', getStatusColor(eq.status))}>
                        {(statusLabel as Record<string, string>)[eq.status]}
                      </Badge>
                      {eq.category && <span className="text-xs text-muted-foreground">{eq.category}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'zh' ? `${eq.formFields.length} 個表單欄位` : `${eq.formFields.length} form fields`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(eq)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(eq.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t.admin.editEquipment : t.admin.addEquipment}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '名稱（中文）' : 'Name (Chinese)'} <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => setF('name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '名稱（英文）' : 'Name (English)'}</Label>
                <Input value={form.nameEn} onChange={(e) => setF('nameEn', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '類別' : 'Category'}</Label>
                <Input value={form.category} onChange={(e) => setF('category', e.target.value)} placeholder="例：光譜量測" />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '狀態' : 'Status'}</Label>
                <Select value={form.status} onValueChange={(v) => setF('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{statusLabel.ACTIVE}</SelectItem>
                    <SelectItem value="MAINTENANCE">{statusLabel.MAINTENANCE}</SelectItem>
                    <SelectItem value="INACTIVE">{statusLabel.INACTIVE}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '設備說明（中文）' : 'Description (Chinese)'}</Label>
                <Textarea value={form.description} onChange={(e) => setF('description', e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '設備說明（英文）' : 'Description (English)'}</Label>
                <Textarea value={form.descriptionEn} onChange={(e) => setF('descriptionEn', e.target.value)} rows={2} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '注意事項（中文）' : 'Notices (Chinese)'}</Label>
                <Textarea value={form.notices} onChange={(e) => setF('notices', e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '注意事項（英文）' : 'Notices (English)'}</Label>
                <Textarea value={form.noticesEn} onChange={(e) => setF('noticesEn', e.target.value)} rows={3} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '負責人' : 'Contact Person'}</Label>
                <Input value={form.contactPerson} onChange={(e) => setF('contactPerson', e.target.value)} placeholder={lang === 'zh' ? '姓名' : 'Name'} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '負責實驗室' : 'Responsible Lab'}</Label>
                <Input value={form.contactLab} onChange={(e) => setF('contactLab', e.target.value)} placeholder={lang === 'zh' ? '實驗室名稱' : 'Lab name'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '圖片 URL（選填）' : 'Image URL (optional)'}</Label>
                <Input value={form.imageUrl} onChange={(e) => setF('imageUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '排序（數字越小越前面）' : 'Order'}</Label>
                <Input type="number" value={form.order} onChange={(e) => setF('order', Number(e.target.value))} />
              </div>
            </div>

            <Separator />

            {/* Form fields editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{lang === 'zh' ? '預約表單欄位' : 'Booking Form Fields'}</span>
                  <Badge variant="outline" className="text-xs">{form.formFields.length}</Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => setGuideOpen(true)}>
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={openAddField}>
                  <Plus className="h-3 w-3 mr-1" />{lang === 'zh' ? '新增欄位' : 'Add Field'}
                </Button>
              </div>

              {form.formFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                  {lang === 'zh' ? '尚無表單欄位，點擊「新增欄位」開始建立' : 'No form fields yet. Click "Add Field" to start.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {form.formFields.map((field, index) => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'flex items-center gap-2 p-3 border rounded-lg bg-muted/30 cursor-grab active:cursor-grabbing transition-colors select-none',
                        dragIndex === index && 'opacity-40',
                        dragOverIndex === index && dragIndex !== index && 'border-primary bg-primary/5'
                      )}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{field.label}</span>
                          {field.labelEn && <span className="text-xs text-muted-foreground">/ {field.labelEn}</span>}
                          <Badge variant="secondary" className="text-xs">{fieldTypeLabel(field.type)}</Badge>
                          {field.required && <Badge variant="outline" className="text-xs text-destructive border-destructive/30">{lang === 'zh' ? '必填' : 'Required'}</Badge>}
                          {field.conditionalOn && <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 dark:text-blue-400">{lang === 'zh' ? `條件：${field.conditionalOn}` : `if: ${field.conditionalOn}`}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">id: {field.id}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveField(index, -1)} disabled={index === 0}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveField(index, 1)} disabled={index === form.formFields.length - 1}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditField(field)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteFieldId(field.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={save} disabled={saving || !form.name}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field editor dialog */}
      <FieldEditorDialog
        open={fieldDialogOpen}
        onOpenChange={setFieldDialogOpen}
        field={editingField}
        existingFields={form.formFields}
        onSave={handleFieldSave}
        lang={lang}
      />

      {/* Field guide dialog */}
      <FieldGuideDialog open={guideOpen} onOpenChange={setGuideOpen} lang={lang} />

      {/* Delete field confirm */}
      <Dialog open={!!deleteFieldId} onOpenChange={(o) => !o && setDeleteFieldId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '確認刪除欄位？' : 'Delete Field?'}</DialogTitle>
            <DialogDescription>
              {lang === 'zh'
                ? `將刪除欄位「${form.formFields.find((f) => f.id === deleteFieldId)?.label}」，此操作無法復原。`
                : `Delete field "${form.formFields.find((f) => f.id === deleteFieldId)?.label}"? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFieldId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteFieldId) deleteField(deleteFieldId)
              setDeleteFieldId(null)
            }}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete equipment confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '確認刪除？' : 'Confirm Delete?'}</DialogTitle>
            <DialogDescription>{lang === 'zh' ? '此操作無法復原' : 'This action cannot be undone'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={deleteEquipment}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
