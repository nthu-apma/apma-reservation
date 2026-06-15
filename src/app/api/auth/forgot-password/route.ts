import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordReset } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid revealing whether email exists
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { email, used: false },
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    })

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

    await sendPasswordReset(email, { userName: user.name, resetUrl })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
