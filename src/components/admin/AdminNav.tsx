'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarCheck, FlaskConical, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function AdminNav({ isSuperAdmin }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const links = [
    { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/admin/reservations', label: t.admin.reservations, icon: CalendarCheck, exact: false },
    { href: '/admin/equipment', label: t.admin.equipment, icon: FlaskConical, exact: false },
    { href: '/admin/users', label: t.admin.users, icon: Users, exact: false },
    { href: '/admin/labs', label: t.admin.labs, icon: Building2, exact: false },
  ]

  return (
    <nav className="w-52 shrink-0 border-r bg-muted/20 hidden md:block">
      <div className="p-4 pt-6 space-y-1">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
