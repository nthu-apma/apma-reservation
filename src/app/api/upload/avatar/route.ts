import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '僅支援 JPG、PNG、WebP、GIF' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '檔案大小超過 5 MB 限制' }, { status: 400 })
    }

    const ext = file.type === 'image/jpeg' ? 'jpg'
      : file.type === 'image/png' ? 'png'
      : file.type === 'image/webp' ? 'webp'
      : 'gif'

    const name = session.user.name ?? session.user.id
    const filename = `${name}.${ext}`
    const dir = join(process.cwd(), 'public', 'images', 'users')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()))

    const avatarUrl = `/api/images/users/${encodeURIComponent(filename)}`
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    })

    return NextResponse.json({ avatarUrl })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
