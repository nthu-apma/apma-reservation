import { prisma } from '@/lib/prisma'

export async function syncPrimaryAdminFromContact(equipmentId: string, contactEmail?: string) {
  if (!contactEmail) return

  const contactUser = await prisma.user.findUnique({
    where: { email: contactEmail },
    select: { id: true, role: true },
  })
  if (!contactUser || (contactUser.role !== 'ADMIN' && contactUser.role !== 'SUPER_ADMIN')) return

  await prisma.equipmentAdmin.updateMany({
    where: { equipmentId, isPrimary: true, userId: { not: contactUser.id } },
    data: { isPrimary: false },
  })
  await prisma.equipmentAdmin.upsert({
    where: { equipmentId_userId: { equipmentId, userId: contactUser.id } },
    create: { equipmentId, userId: contactUser.id, isPrimary: true },
    update: { isPrimary: true },
  })
}
