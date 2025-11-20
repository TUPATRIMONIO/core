'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tupatrimonio/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Lock, Mail, UserRound } from 'lucide-react'
import type { AuthError } from '@supabase/supabase-js'

interface SignupFormProps {
  onSignupCompleted?: () => void
}

interface PasswordValidation {
  message: string
  test: (value: string) => boolean
}

const PASSWORD_RULES: PasswordValidation[] = [
  { message: 'Al menos 8 caracteres', test: (value) => value.length >= 8 },
  { message: 'Una letra en mayúscula', test: (value) => /[A-Z]/.test(value) },
  { message: 'Una letra en minúscula', test: (value) => /[a-z]/.test(value) },
  { message: 'Un número', test: (value) => /[0-9]/.test(value) },
]

const AUTH_TIMEOUT_MS = 15000

const mapSignupError = (error: AuthError): string => {
  const message = error.message?.toLowerCase() ?? ''

  if (message.includes('user already registered')) {
    return 'Ya tienes una cuenta con este correo. Inicia sesión para continuar.'
  }

  if (error.status === 429) {
    return 'Estamos recibiendo muchas solicitudes. Intenta nuevamente en un minuto.'
  }

  return error.message || 'No pudimos crear tu cuenta. Intenta de nuevo en unos segundos.'
}

export function SignupForm({ onSignupCompleted }: SignupFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOauthLoading, setIsOauthLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    setErrorMessage(null)
  }, [fullName, email, password, confirmPassword])

  const isLoading = isSubmitting || isOauthLoading
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const passwordChecks = useMemo(
    () =>
      PASSWORD_RULES.map((rule) => ({
        ...rule,
        valid: rule.test(password),
      })),
    [password]
  )

  const canSubmit =
    !isLoading &&
    fullName.trim().length > 2 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    passwordsMatch &&
    passwordChecks.every((rule) => rule.valid)

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleEmailSignup = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: `${window.location.origin}/callback`,
          },
        })
      )

      if (error) {
        setErrorMessage(mapSignupError(error))
        return
      }

      resetForm()

      if (data?.user && !data.session) {
        setShowSuccess(true)
        setInfoMessage(`Hemos enviado un enlace de verificación a ${data.user.email}`)
      } else {
        onSignupCompleted?.()
        router.replace('/onboarding')
        router.refresh()
      }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      if (error instanceof Error && error.message === 'timeout') {
        setErrorMessage('La creación de la cuenta está tardando demasiado. Revisa tu conexión e inténtalo una vez más.')
      } else {
        setErrorMessage('No pudimos crear tu cuenta. Intenta nuevamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOAuthSignup = async () => {
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
        setErrorMessage(error.message || 'No pudimos conectar con Google. Intenta de nuevo.')
        setIsOauthLoading(false)
      }
    } catch (error) {
      console.error('Unexpected signup oauth error:', error)
      setErrorMessage('No pudimos conectar con Google. Intenta de nuevo.')
      setIsOauthLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Card className="bg-[var(--tp-background-light)] shadow-[var(--tp-shadow-xl)] border-none p-0">
        <CardHeader className="gap-3 px-6 pt-8 text-center">
          <CardTitle className="text-3xl font-bold text-[var(--tp-buttons)]">Revisa tu correo</CardTitle>
          <CardDescription>
            Te enviamos un enlace para activar tu cuenta. Si no lo encuentras, revisa en tu carpeta de spam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-0">
          {infoMessage && (
            <Alert>
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8">
          <Button
            type="button"
            className="h-11 rounded-full bg-[var(--tp-buttons)] font-semibold text-white hover:bg-[var(--tp-buttons-hover)]"
            onClick={() => router.replace('/login')}
          >
            Volver al inicio de sesión
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No recibiste el correo?
            <button
              type="button"
              className="ml-1 font-semibold text-[var(--tp-buttons)] underline-offset-4 transition hover:text-[var(--tp-buttons-hover)] hover:underline"
              onClick={() => setInfoMessage('Reenviamos el enlace a tu correo. Revisa nuevamente.')}
            >
              Reenviarlo
            </button>
          </p>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="bg-[var(--tp-background-light)] shadow-[var(--tp-shadow-xl)] border-none p-0">
      <CardHeader className="gap-3 px-6 pt-8">
        <CardTitle className="text-3xl font-bold text-[var(--tp-buttons)]">Crea tu cuenta</CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Regístrate en menos de un minuto y accede a todos tus trámites desde un solo lugar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-0">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleEmailSignup}>
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-[var(--tp-background-dark)]">
              Nombre completo
            </Label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tp-lines-30)]" />
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre y apellido"
                disabled={isLoading}
                className="pl-9 pr-3 h-11 rounded-xl bg-white"
                required
              />
            </div>
          </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="pl-9 pr-3 h-11 rounded-xl bg-white"
                required
              />
            </div>
            <ul className="grid gap-1 text-xs text-muted-foreground">
              {passwordChecks.map((rule) => (
                <li key={rule.message} className={rule.valid ? 'text-emerald-600' : undefined}>
                  • {rule.message}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--tp-background-dark)]">
              Confirmar contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite tu contraseña"
              disabled={isLoading}
              className="h-11 rounded-xl bg-white"
              required
            />
            {password.length > 0 && confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-destructive">Las contraseñas deben coincidir.</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 rounded-full bg-[var(--tp-buttons)] font-semibold text-white shadow-[var(--tp-shadow-md)] transition hover:bg-[var(--tp-buttons-hover)]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Creando cuenta...
              </span>
            ) : (
              'Crear cuenta'
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
          onClick={handleOAuthSignup}
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
          ¿Ya tienes cuenta?
          <Link
            href="/login"
            className="ml-1 font-semibold text-[var(--tp-buttons)] underline-offset-4 transition hover:text-[var(--tp-buttons-hover)] hover:underline"
          >
            Inicia sesión
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Al registrarte aceptas nuestros{' '}
          <Link href="/legal/terminos" className="font-semibold text-[var(--tp-buttons)] underline-offset-4 hover:text-[var(--tp-buttons-hover)] hover:underline">
            Términos
          </Link>{' '}
          y{' '}
          <Link href="/legal/privacidad" className="font-semibold text-[var(--tp-buttons)] underline-offset-4 hover:text-[var(--tp-buttons-hover)] hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  )
}


