'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Lock } from 'lucide-react'
import type { AuthError } from '@supabase/supabase-js'

interface LoginFormProps {
  initialEmail?: string | null
  initialError?: string | null
  initialMessage?: string | null
  redirectTo?: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'No encontramos una cuenta con esos datos. Revisa tu correo y contraseña.',
  email_not_confirmed: 'Tu correo aún no está confirmado. Revisa tu bandeja o solicita un nuevo enlace.',
  rate_limit_exceeded: 'Demasiados intentos. Intenta nuevamente en un par de minutos.',
}

const DEFAULT_ERROR_MESSAGE = 'No pudimos iniciar sesión. Intenta de nuevo en unos segundos.'
const AUTH_TIMEOUT_MS = 15000

const isSafeRedirect = (redirectTo: string | null | undefined) => {
  if (!redirectTo) return false
  try {
    const url = new URL(redirectTo, 'https://placeholder.local')
    return url.origin === 'https://placeholder.local' && url.pathname.startsWith('/')
  } catch {
    return redirectTo.startsWith('/')
  }
}

const mapSupabaseError = (error: AuthError): string => {
  const code = error.message?.toLowerCase()

  if (code?.includes('invalid login credentials')) {
    return ERROR_MESSAGES.invalid_credentials
  }

  if (code?.includes('email not confirmed')) {
    return ERROR_MESSAGES.email_not_confirmed
  }

  if (error.status === 429) {
    return ERROR_MESSAGES.rate_limit_exceeded
  }

  return error.message || DEFAULT_ERROR_MESSAGE
}

export function LoginForm({ initialEmail, initialError, initialMessage, redirectTo }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail ?? '')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null)
  const [infoMessage, setInfoMessage] = useState<string | null>(initialMessage ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOauthLoading, setIsOauthLoading] = useState(false)

  useEffect(() => {
    setErrorMessage(initialError ?? null)
  }, [initialError])

  useEffect(() => {
    setInfoMessage(initialMessage ?? null)
  }, [initialMessage])

  const isLoading = isSubmitting || isOauthLoading
  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !isLoading
  const safeRedirect = useMemo(() => (isSafeRedirect(redirectTo) ? redirectTo! : '/dashboard'), [redirectTo])

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      const withTimeout = async <T>(promise: Promise<T>) => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('timeout')), AUTH_TIMEOUT_MS)
        })

        try {
          return await Promise.race([promise, timeoutPromise])
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }
      }

      const supabase = createClient()
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
      )

      if (error) {
        setErrorMessage(mapSupabaseError(error))
        return
      }

      setPassword('')
      router.replace(safeRedirect)
      router.refresh()
    } catch (error) {
      console.error('Unexpected login error:', error)
      if (error instanceof Error && error.message === 'timeout') {
        setErrorMessage('La autenticación está tardando demasiado. Por favor, revisa tu conexión e inténtalo nuevamente.')
      } else {
        setErrorMessage(DEFAULT_ERROR_MESSAGE)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOAuthLogin = async () => {
    setErrorMessage(null)
    setInfoMessage(null)
    setIsOauthLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })

      if (error) {
        setErrorMessage(error.message ?? DEFAULT_ERROR_MESSAGE)
        setIsOauthLoading(false)
      }
    } catch (error) {
      console.error('Unexpected oauth error:', error)
      setErrorMessage(DEFAULT_ERROR_MESSAGE)
      setIsOauthLoading(false)
    }
  }

  return (
    <Card className="bg-[var(--tp-background-light)] shadow-[var(--tp-shadow-xl)] border-none p-0">
      <CardHeader className="gap-3 px-6 pt-8">
        <CardTitle className="text-3xl font-bold text-[var(--tp-buttons)]">Bienvenido</CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Ingresa tus datos para continuar. Si aún no tienes cuenta, puedes registrarte en segundos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-0">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {infoMessage && (
          <Alert>
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handlePasswordLogin}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-[var(--tp-background-dark)]">
              Correo electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tp-lines-30)]" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tucorreo@ejemplo.com"
                disabled={isLoading}
                className="pl-9 pr-3 h-11 rounded-xl bg-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-[var(--tp-background-dark)]">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tp-lines-30)]" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="pl-9 pr-3 h-11 rounded-xl bg-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="font-semibold text-[var(--tp-buttons)] transition-colors hover:text-[var(--tp-buttons-hover)]"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 rounded-full bg-[var(--tp-buttons)] font-semibold text-white shadow-[var(--tp-shadow-md)] transition hover:bg-[var(--tp-buttons-hover)]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>

        <div className="py-2">
          <Separator className="bg-[var(--tp-lines-30)]" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-6 pb-8">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={handleOAuthLogin}
          className="h-12 w-full rounded-full border-2 border-[var(--tp-lines-30)] bg-white font-semibold text-[var(--tp-background-dark)] transition hover:bg-[var(--tp-bg-light-10)]"
        >
          {isOauthLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Conectando con Google...
            </span>
          ) : (
            'Continuar con Google'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?
          <Link
            href="/register"
            className="ml-1 font-semibold text-[var(--tp-buttons)] underline-offset-4 transition hover:text-[var(--tp-buttons-hover)] hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}


