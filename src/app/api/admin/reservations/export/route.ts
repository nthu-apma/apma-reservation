import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待審核',
  CONFIRMED: '已確認',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '爽約',
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const archivedOnly = searchParams.get('archived') === 'true'

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status
  where.archived = archivedOnly

  // ADMIN can only export their equipment's reservations
  if (session.user.role === 'ADMIN') {
    const myEquipment = await prisma.equipmentAdmin.findMany({
      where: { userId: session.user.id },
      select: { equipmentId: true },
    })
    where.equipmentId = { in: myEquipment.map((e) => e.equipmentId) }
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, institution: true } },
      equipment: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const allFormDataKeys = Array.from(
    new Set(
      reservations.flatMap((r) => Object.keys((r.formData as Record<string, string>) ?? {}))
    )
  )

  const headers = [
    '申請ID', '申請時間', '設備/服務', '用戶姓名', '電子郵件', '所屬單位',
    '狀態', '封存', '管理員備注', '取消原因',
    ...allFormDataKeys,
  ]

  const rows = reservations.map((r) => {
    const fd = (r.formData ?? {}) as Record<string, string>
    return [
      r.id,
      format(r.createdAt, 'yyyy-MM-dd HH:mm'),
      r.equipment.name,
      r.user.name,
      r.user.email,
      r.user.institution ?? '',
      STATUS_LABELS[r.status] ?? r.status,
      r.archived ? '是' : '否',
      r.adminNote ?? '',
      r.cancelReason ?? '',
      ...allFormDataKeys.map((k) => fd[k] ?? ''),
    ]
  })

  const BOM = '﻿'
  const csv = BOM + [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n')

  const filename = `consultations_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
