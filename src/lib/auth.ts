import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as string,
          avatarUrl: user.avatarUrl ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionData }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as unknown as { role: string }).role
        token.avatarUrl = (user as unknown as { avatarUrl?: string | null }).avatarUrl ?? null
      }
      if (trigger === 'update') {
        const upd = sessionData as { name?: string; avatarUrl?: string | null }
        if (upd?.name) token.name = upd.name
        if ('avatarUrl' in upd) token.avatarUrl = upd.avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null
      }
      return session
    },
  },
}

export function isAdminRole(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}
