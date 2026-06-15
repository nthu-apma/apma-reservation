'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

interface Lab {
  id: string; name: string; nameEn?: string | null
  logoUrl?: string | null; logoUrlDark?: string | null
  website?: string | null; description?: string | null
  order: number; active: boolean
}

const emptyLab = { name: '', nameEn: '', logoUrl: '', logoUrlDark: '', website: '', description: '', order: 0, active: true }

export function AdminLabsClient({ labs }: { labs: Lab[] }) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Lab | null>(null)
  const [form, setForm] = useState(emptyLab)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null); setForm(emptyLab); setDialogOpen(true)
  }

  function openEdit(lab: Lab) {
    setEditing(lab)
    setForm({
      name: lab.name, nameEn: lab.nameEn ?? '',
      logoUrl: lab.logoUrl ?? '', logoUrlDark: lab.logoUrlDark ?? '',
      website: lab.website ?? '', description: lab.description ?? '',
      order: lab.order, active: lab.active,
    })
    setDialogOpen(true)
  }

  async function save() {
    setSaving(true)
    try {
      const url = editing ? `/api/admin/labs/${editing.id}` : '/api/admin/labs'
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

  async function deleteLab() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/labs/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(lang === 'zh' ? '已刪除' : 'Deleted')
      setDeleteId(null)
      router.refresh()
    } catch {
      toast.error(t.common.error)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.admin.labs}</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />{t.admin.addLab}
        </Button>
      </div>

      {labs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{lang === 'zh' ? '尚無實驗室' : 'No labs yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {labs.map((lab) => (
            <Card key={lab.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {lab.logoUrl ? (
                      <img
                        src={(resolvedTheme === 'dark' && lab.logoUrlDark) ? lab.logoUrlDark : lab.logoUrl}
                        alt={lab.name}
                        className="h-16 w-16 object-contain rounded"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-primary/50" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{lab.name}</span>
                        {!lab.active && (
                          <Badge variant="outline" className="text-xs">{lang === 'zh' ? '已停用' : 'Inactive'}</Badge>
                        )}
                      </div>
                      {lab.nameEn && <p className="text-xs text-muted-foreground">{lab.nameEn}</p>}
                      {lab.website && <a href={lab.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{lab.website}</a>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(lab)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(lab.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t.admin.editLab : t.admin.addLab}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '名稱（中文）' : 'Name (Chinese)'} *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '名稱（英文）' : 'Name (English)'}</Label>
                <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? 'Logo（亮色模式）' : 'Logo (Light Mode)'}</Label>
              <Input value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? 'Logo（暗色模式）' : 'Logo (Dark Mode)'}</Label>
              <Input value={form.logoUrlDark} onChange={(e) => setForm((p) => ({ ...p, logoUrlDark: e.target.value }))} placeholder={lang === 'zh' ? '（選填，不填則沿用亮色 Logo）' : '(optional, fallback to light logo)'} />
            </div>
            {(form.logoUrl || form.logoUrlDark) && (
              <div className="flex gap-4">
                {form.logoUrl && (
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">{lang === 'zh' ? '亮色預覽' : 'Light preview'}</p>
                    <div className="h-12 border rounded flex items-center justify-center bg-white p-1">
                      <img src={form.logoUrl} alt="light" className="h-full object-contain" />
                    </div>
                  </div>
                )}
                {form.logoUrlDark && (
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">{lang === 'zh' ? '暗色預覽' : 'Dark preview'}</p>
                    <div className="h-12 border rounded flex items-center justify-center bg-gray-900 p-1">
                      <img src={form.logoUrlDark} alt="dark" className="h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '官網 URL' : 'Website URL'}</Label>
              <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '描述' : 'Description'}</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{lang === 'zh' ? '排序' : 'Order'}</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))} />
                <Label>{lang === 'zh' ? '顯示中' : 'Active'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={save} disabled={saving || !form.name}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '確認刪除？' : 'Confirm Delete?'}</DialogTitle>
            <DialogDescription>{lang === 'zh' ? '此操作無法復原' : 'This cannot be undone'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={deleteLab}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
