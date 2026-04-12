import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'

import { prisma } from '@/lib/prisma'

const providers = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'E-mail', type: 'email' },
      password: { label: 'Senha', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null
      const email = String(credentials.email).toLowerCase().trim()
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.password) return null
      const valid = await compare(String(credentials.password), user.password)
      if (!valid) return null
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }
    },
  }),
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  )
}

/* Apple — descomente quando tiver AUTH_APPLE_ID / AUTH_APPLE_SECRET configurados:
import Apple from "next-auth/providers/apple"
providers.push(
  Apple({
    clientId: process.env.AUTH_APPLE_ID!,
    clientSecret: process.env.AUTH_APPLE_SECRET!,
  }),
)
*/

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) session.user.id = user.id
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })
        if (existing?.password) {
          const linkedGoogle = existing.accounts.some((a) => a.provider === 'google')
          if (!linkedGoogle) {
            return '/login?error=OAuthAccountNotLinked'
          }
        }
      }
      return true
    },
  },
  trustHost: true,
})
