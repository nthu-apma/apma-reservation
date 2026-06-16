export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookingClient } from '@/components/booking/BookingClient'

export default async function BookingPage({ params }: { params: { equipmentId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/auth/login?callbackUrl=/booking/${params.equipmentId}`)

  const equipment = await prisma.equipment.findUnique({ where: { id: params.equipmentId } })
  if (!equipment || equipment.status !== 'ACTIVE') notFound()

  return (
    <BookingClient
      equipment={{
        ...equipment,
        formFields: equipment.formFields as never,
      }}
    />
  )
}
