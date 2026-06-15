'use client'
import Link from 'next/link'
import Image from 'next/image'
import { FlaskConical, Microscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn, getStatusColor } from '@/lib/utils'
import { useTheme } from 'next-themes'

interface Equipment {
  id: string
  name: string
  nameEn?: string | null
  description?: string | null
  descriptionEn?: string | null
  category?: string | null
  imageUrl?: string | null
  status: string
}

interface Lab {
  id: string
  name: string
  nameEn?: string | null
  logoUrl?: string | null
  logoUrlDark?: string | null
  website?: string | null
}

export function HomeClient({ equipment, labs }: { equipment: Equipment[]; labs: Lab[] }) {
  const { lang, t } = useLanguage()
  const { resolvedTheme } = useTheme()

  const statusLabel = (status: string) => {
    const labels = {
      zh: { ACTIVE: '可預約', MAINTENANCE: '維護中', INACTIVE: '暫停服務' },
      en: { ACTIVE: 'Available', MAINTENANCE: 'Maintenance', INACTIVE: 'Inactive' },
    }
    return (labels[lang] as Record<string, string>)[status] ?? status
  }

  return (
    <div>
      {/* Equipment grid */}
      <section className="py-10">
        <div className="container">
          <p className="text-sm text-muted-foreground mb-6">
            {lang === 'zh' ? '點擊設備查看詳情並預約' : 'Click on equipment to view details and book'}
          </p>

          {equipment.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Microscope className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{lang === 'zh' ? '目前尚無開放設備' : 'No equipment available'}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.map((eq) => (
                <Card key={eq.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">
                        {lang === 'zh' ? eq.name : (eq.nameEn || eq.name)}
                      </CardTitle>
                      <Badge className={cn('shrink-0 text-xs', getStatusColor(eq.status))}>
                        {statusLabel(eq.status)}
                      </Badge>
                    </div>
                    {eq.category && (
                      <span className="text-xs text-muted-foreground">{eq.category}</span>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    {eq.imageUrl ? (
                      <div className="relative h-40 w-full rounded-md overflow-hidden mb-3 bg-muted">
                        <Image src={eq.imageUrl} alt={eq.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-40 w-full rounded-md bg-muted flex items-center justify-center mb-3">
                        <FlaskConical className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {lang === 'zh' ? eq.description : (eq.descriptionEn || eq.description)}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/equipment/${eq.id}`}>
                        {lang === 'zh' ? '查看詳情' : 'View Details'}
                      </Link>
                    </Button>
                    {eq.status === 'ACTIVE' && (
                      <Button size="sm" asChild className="flex-1">
                        <Link href={`/booking/${eq.id}`}>
                          {lang === 'zh' ? '立即預約' : 'Book Now'}
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Labs */}
      {labs.length > 0 && (
        <section className="py-10 bg-muted/30 border-t">
          <div className="container">
            <h2 className="text-lg font-bold mb-1">
              {lang === 'zh' ? '聯盟實驗室' : 'Alliance Laboratories'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {lang === 'zh' ? '本系統由以下實驗室共同支持' : 'This system is jointly supported by the following laboratories'}
            </p>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {labs.map((lab) => {
                const src = resolvedTheme === 'dark' && lab.logoUrlDark ? lab.logoUrlDark : lab.logoUrl
                const inner = (
                  <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-background hover:shadow-md transition-shadow cursor-pointer">
                    {src ? (
                      <div className="relative h-16 w-full">
                        <Image src={src} alt={lab.name} fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <FlaskConical className="h-8 w-8 text-primary/50" />
                      </div>
                    )}
                    <p className="text-xs font-medium leading-tight text-center">
                      {lang === 'zh' ? lab.name : (lab.nameEn || lab.name)}
                    </p>
                  </div>
                )

                return lab.website ? (
                  <a key={lab.id} href={lab.website} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div key={lab.id}>{inner}</div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
