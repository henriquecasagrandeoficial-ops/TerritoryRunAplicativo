import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { token, password } = parsed.data

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado.' },
      { status: 400 },
    )
  }

  const email = record.email
  const passwordHash = await hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { password: passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ])

  return NextResponse.json({ ok: true })
}
