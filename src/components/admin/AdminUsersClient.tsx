'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface User {
  id: string; email: string; name: string
  institution?: string | null; lab?: string | null
  avatarUrl?: string | null
  role: string; createdAt: Date
  _count: { reservations: number }
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  USER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

const ROLE_TABS = ['ALL', 'SUPER_ADMIN', 'ADMIN', 'USER'] as const

export function AdminUsersClient({ users }: { users: User[] }) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const { data: session } = useSession()
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [roleTab, setRoleTab] = useState<string>('ALL')

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  async function changeRole(userId: string, role: string) {
    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error()
      toast.success(lang === 'zh' ? '角色已更新' : 'Role updated')
      router.refresh()
    } catch {
      toast.error(t.common.error)
    } finally {
      setUpdating(null)
    }
  }

  async function deleteUser(userId: string) {
    setDeleting(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? t.common.error)
        return
      }
      toast.success(lang === 'zh' ? '用戶已刪除' : 'User deleted')
      router.refresh()
    } catch {
      toast.error(t.common.error)
    } finally {
      setDeleting(null)
      setConfirmUser(null)
    }
  }

  const filtered = roleTab === 'ALL' ? users : users.filter((u) => u.role === roleTab)

  const tabLabel = (role: string) => {
    if (role === 'ALL') return lang === 'zh' ? '全部' : 'All'
    return (t.admin.role as Record<string, string>)[role] ?? role
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{t.admin.users}</h1>

      <Tabs value={roleTab} onValueChange={setRoleTab}>
        <TabsList>
          {ROLE_TABS.map((role) => (
            <TabsTrigger key={role} value={role} className="text-xs">
              {tabLabel(role)}
              <span className="ml-1 opacity-60">
                ({role === 'ALL' ? users.length : users.filter((u) => u.role === role).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={roleTab}>
          <div className="space-y-3 mt-4">
            {filtered.map((user) => (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="h-14 w-14 shrink-0">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {user.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{user.name}</span>
                          <Badge className={`text-xs ${ROLE_COLORS[user.role] ?? ROLE_COLORS.USER}`}>
                            {(t.admin.role as Record<string, string>)[user.role] ?? user.role}
                          </Badge>
                          {user.id === session?.user?.id && (
                            <Badge variant="outline" className="text-xs">{lang === 'zh' ? '（你）' : '(You)'}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.institution && (
                          <p className="text-xs text-muted-foreground">{user.institution}{user.lab ? ` · ${user.lab}` : ''}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {lang === 'zh' ? `${user._count.reservations} 次申請` : `${user._count.reservations} requests`}
                          {' · '}{formatDate(user.createdAt, lang)}
                        </p>
                      </div>
                    </div>

                    {user.id !== session?.user?.id && (
                      <div className="shrink-0 flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(v) => changeRole(user.id, v)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">{t.admin.role.USER}</SelectItem>
                            <SelectItem value="ADMIN">{t.admin.role.ADMIN}</SelectItem>
                            {isSuperAdmin && (
                              <SelectItem value="SUPER_ADMIN">{(t.admin.role as Record<string, string>).SUPER_ADMIN}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmUser(user)}
                          disabled={deleting === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!confirmUser} onOpenChange={(open) => { if (!open) setConfirmUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '確認刪除用戶' : 'Delete User'}</DialogTitle>
            <DialogDescription>
              {lang === 'zh'
                ? `確定要刪除「${confirmUser?.name}」（${confirmUser?.email}）嗎？此操作無法復原，該用戶的所有申請紀錄也會一併刪除。`
                : `Are you sure you want to delete "${confirmUser?.name}" (${confirmUser?.email})? This cannot be undone and all their records will also be deleted.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmUser && deleteUser(confirmUser.id)}
              disabled={deleting === confirmUser?.id}
            >
              {lang === 'zh' ? '確認刪除' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
