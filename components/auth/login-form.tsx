'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Map } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { loginSchema, type LoginFormValues } from '@/lib/auth/schemas'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginForm({
  className,
  googleEnabled,
}: {
  className?: string
  googleEnabled: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [showPassword, setShowPassword] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/mapa')
    }
  }, [status, router])

  const registeredToast = React.useRef(false)
  React.useEffect(() => {
    if (searchParams.get('registered') !== '1' || registeredToast.current) return
    registeredToast.current = true
    toast.success('Conta criada. Faça login para continuar.')
    router.replace('/login', { scroll: false })
  }, [searchParams, router])

  const oauthWarned = React.useRef(false)
  React.useEffect(() => {
    if (searchParams.get('error') !== 'OAuthAccountNotLinked' || oauthWarned.current)
      return
    oauthWarned.current = true
    form.setError('root', {
      message:
        'Este e-mail já possui senha. Entre com e-mail e senha ou use outra conta Google.',
    })
  }, [searchParams, form])

  async function onSubmit(data: LoginFormValues) {
    form.clearErrors('root')
    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (res?.error) {
      form.setError('root', {
        message: 'E-mail ou senha incorretos.',
      })
      return
    }
    if (res?.ok) {
      router.replace('/mapa')
      router.refresh()
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/mapa' })
    } finally {
      setGoogleLoading(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-5', className)}
      >
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  disabled={submitting || googleLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Senha</FormLabel>
                <Link
                  href="/esqueci-senha"
                  className="text-xs text-accent hover:underline"
                  tabIndex={-1}
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pr-10"
                    disabled={submitting || googleLoading}
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={submitting || googleLoading}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={submitting || googleLoading}
        >
          {submitting ? (
            <>
              <Spinner className="size-4" />
              Entrando...
            </>
          ) : (
            <>
              <Map className="size-4" />
              Entrar
            </>
          )}
        </Button>

        {googleEnabled && (
          <>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-border bg-secondary/30"
              disabled={submitting || googleLoading}
              onClick={handleGoogle}
            >
              {googleLoading ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <GoogleIcon className="size-4" />
                  Continuar com Google
                </>
              )}
            </Button>
          </>
        )}
      </form>
    </Form>
  )
}
