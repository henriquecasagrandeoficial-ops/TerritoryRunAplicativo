import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/auth/schemas'

/**
 * MVP: grava token de reset; em produção envie o link por e-mail (Resend, SES, etc.).
 */
export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = forgotPasswordSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'E-mail inválido' },
      { status: 400 },
    )
  }

  const email = parsed.data.email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email } })

  // Resposta genérica se o e-mail não existir (anti-enumeração)
  const generic = {
    ok: true as const,
    message:
      'Se existir uma conta com este e-mail, enviaremos instruções em breve.',
  }

  if (!user?.password) {
    return NextResponse.json(generic)
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.deleteMany({ where: { email } })
  await prisma.passwordResetToken.create({
    data: { email, token, expires },
  })

  const base =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const resetUrl = `${base.replace(/\/$/, '')}/esqueci-senha?token=${token}`

  if (process.env.NODE_ENV === 'development') {
    console.info('[forgot-password] reset link (dev only):', resetUrl)
  }

  return NextResponse.json(generic)
}
