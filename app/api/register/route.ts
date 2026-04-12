import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/auth/schemas'

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { name, email, password } = parsed.data
  const emailLower = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Este e-mail já está cadastrado.' },
      { status: 409 },
    )
  }

  const passwordHash = await hash(password, 12)

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: emailLower,
      password: passwordHash,
    },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
