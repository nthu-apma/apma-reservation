'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Globe, FlaskConical, Menu, X, Pencil, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

export function Navbar() {
  const { data: session, update } = useSession()
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Edit name
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Avatar upload
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  function openEditName() {
    setNewName(session?.user?.name ?? '')
    setEditNameOpen(true)
  }

  async function saveName() {
    if (!newName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error()
      await update({ name: newName.trim() })
      toast.success(lang === 'zh' ? '名稱已更新' : 'Name updated')
      setEditNameOpen(false)
    } catch {
      toast.error(lang === 'zh' ? '更新失敗' : 'Update failed')
    } finally {
      setSavingName(false)
    }
  }

  function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function uploadAvatar() {
    if (!avatarFile) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', avatarFile)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const { avatarUrl } = await res.json()
      await update({ avatarUrl })
      toast.success(lang === 'zh' ? '頭貼已更新' : 'Avatar updated')
      setAvatarOpen(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (lang === 'zh' ? '上傳失敗' : 'Upload failed'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <FlaskConical className="h-6 w-6 shrink-0" />
          <span className="hidden sm:block text-sm leading-tight">
            {lang === 'zh' ? (
              <>
                <span className="font-bold">清華大學 - 前瞻光電技術與材料聯盟 | 量測預約平台</span>
                <br />
                <span className="text-xs font-normal text-muted-foreground">提供跨實驗室頂尖研究設備共享服務，促進研究合作與資源共享，加速科學發現</span>
              </>
            ) : (
              <>
                <span className="font-bold">NTHU – Advanced Photonics & Material Alliance</span>
                <br />
                <span className="text-xs font-normal text-muted-foreground">Equipment Reservation Platform</span>
              </>
            )}
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="gap-1 text-xs"
          >
            <Globe className="h-4 w-4" />
            {lang === 'zh' ? 'EN' : '中文'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {session.user.avatarUrl && (
                      <AvatarImage
                        src={session.user.avatarUrl}
                        alt={session.user.name}
                        key={session.user.avatarUrl}
                      />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">{t.nav.myBookings}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">{t.nav.admin}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAvatarOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {lang === 'zh' ? '上傳頭貼' : 'Upload Avatar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openEditName}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {lang === 'zh' ? '修改名稱' : 'Edit Name'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  {t.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">{t.nav.login}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">{t.nav.register}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu (unauthenticated only) */}
          {!session && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Edit name dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '修改名稱' : 'Edit Name'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{lang === 'zh' ? '顯示名稱' : 'Display Name'}</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              placeholder={lang === 'zh' ? '輸入新名稱' : 'Enter new name'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameOpen(false)}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button onClick={saveName} disabled={savingName || !newName.trim()}>
              {lang === 'zh' ? '儲存' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar upload dialog */}
      <Dialog open={avatarOpen} onOpenChange={(o) => { setAvatarOpen(o); if (!o) { setAvatarFile(null); setAvatarPreview(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '上傳頭貼' : 'Upload Avatar'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {avatarPreview ? (
              <div className="flex justify-center">
                <Image src={avatarPreview} alt="preview" width={96} height={96} className="rounded-full object-cover w-24 h-24" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  {session?.user.avatarUrl && <AvatarImage src={session.user.avatarUrl} />}
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {session?.user.name?.[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onAvatarFileChange}
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              {lang === 'zh' ? '選擇圖片' : 'Choose Image'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {lang === 'zh' ? '支援 JPG、PNG、WebP、GIF，最大 5 MB' : 'JPG, PNG, WebP, GIF · max 5 MB'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvatarOpen(false)}>{lang === 'zh' ? '取消' : 'Cancel'}</Button>
            <Button onClick={uploadAvatar} disabled={!avatarFile || uploadingAvatar}>
              {lang === 'zh' ? '上傳' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile menu (unauthenticated) */}
      {mobileOpen && !session && (
        <div className="md:hidden border-t p-4 bg-background">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>{t.nav.login}</Link>
            </Button>
            <Button size="sm" asChild className="flex-1">
              <Link href="/auth/register" onClick={() => setMobileOpen(false)}>{t.nav.register}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
