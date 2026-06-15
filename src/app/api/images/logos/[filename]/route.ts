import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
}

export async function GET(_req: Request, { params }: { params: { filename: string } }) {
  const filename = decodeURIComponent(params.filename)
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  try {
    const file = await readFile(join(process.cwd(), 'public', 'images', 'logos', filename))
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'png'
    return new NextResponse(file, {
      headers: { 'Content-Type': MIME[ext] ?? 'image/png' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
