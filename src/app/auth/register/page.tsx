'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

export default function RegisterPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', institution: '', lab: '', phone: '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error(t.auth.confirmPassword + ' 不符')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email, password: form.password,
          name: form.name, institution: form.institution,
          lab: form.lab, phone: form.phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) toast.error('此 Email 已被註冊')
        else toast.error(t.common.error)
      } else {
        toast.success(t.auth.registerSuccess)
        router.push('/auth/login')
      }
    } catch {
      toast.error(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FlaskConical className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>{t.auth.registerTitle}</CardTitle>
          <CardDescription>清華大學研究聯盟預約系統</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">{t.auth.name} <span className="text-destructive">*</span></Label>
                <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="email">{t.auth.email} <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t.auth.password} <span className="text-destructive">*</span></Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">{t.auth.confirmPassword} <span className="text-destructive">*</span></Label>
                <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="institution">{t.auth.institution} <span className="text-destructive">*</span></Label>
                <Input id="institution" value={form.institution} onChange={(e) => update('institution', e.target.value)} required placeholder="例：國立清華大學化學系" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lab">{t.auth.lab}</Label>
                <Input id="lab" value={form.lab} onChange={(e) => update('lab', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t.auth.phone}</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.auth.registering : t.auth.registerBtn}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t.auth.hasAccount}{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                {t.auth.loginLink}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
