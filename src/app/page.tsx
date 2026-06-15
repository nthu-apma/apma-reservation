import { prisma } from '@/lib/prisma'
import { HomeClient } from '@/components/home/HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [equipment, labs] = await Promise.all([
    prisma.equipment.findMany({
      where: { status: { not: 'INACTIVE' } },
      orderBy: { order: 'asc' },
      select: {
        id: true, name: true, nameEn: true, description: true,
        descriptionEn: true, category: true, imageUrl: true, status: true,
      },
    }),
    prisma.lab.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    }),
  ])

  return <HomeClient equipment={equipment} labs={labs} />
}
