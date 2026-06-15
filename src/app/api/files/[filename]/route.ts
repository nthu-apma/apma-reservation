import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename

  if (!filename || filename.includes('/') || filename.includes('..') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const filePath = join(process.cwd(), 'public', 'uploads', filename)

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const buffer = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}
