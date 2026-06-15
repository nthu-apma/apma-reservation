import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const archivedOnly = searchParams.get('archived') === 'true'

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status
  where.archived = archivedOnly

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, institution: true } },
      equipment: { select: { name: true } },
      timeSlot: { select: { date: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const allFormDataKeys = Array.from(
    new Set(
      reservations.flatMap((r) => Object.keys((r.formData as Record<string, string>) ?? {}))
    )
  )

  const headers = [
    '預約ID', '申請時間', '設備', '用戶姓名', '電子郵件', '所屬單位',
    '量測日期', '開始時間', '結束時間', '狀態', '封存', '管理員備注', '取消原因',
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
      format(r.timeSlot.date, 'yyyy-MM-dd'),
      r.timeSlot.startTime,
      r.timeSlot.endTime,
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

  const filename = `reservations_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
