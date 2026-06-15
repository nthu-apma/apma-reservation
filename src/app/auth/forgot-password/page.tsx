'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FlaskConical, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
      toast.success(t.auth.forgotPasswordSent)
    } catch {
      toast.error('發生錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FlaskConical className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>{t.auth.forgotPasswordTitle}</CardTitle>
          <CardDescription>{t.auth.forgotPasswordDesc}</CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-200 text-center">
              {t.auth.forgotPasswordSent}
            </div>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.auth.backToLogin}
              </Button>
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.auth.forgotPasswordSending : t.auth.forgotPasswordBtn}
              </Button>
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                {t.auth.backToLogin}
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
