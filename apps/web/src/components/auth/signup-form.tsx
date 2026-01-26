'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { resendVerificationEmail, signUp } from '@/lib/auth/actions'
import { OAuthButtons } from './oauth-buttons'

interface SignupFormProps {
  redirectTo?: string
}

export function SignupForm({ redirectTo }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [resendLoading, setResendLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setResendStatus(null)

    // Validaciones client-side
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    if (redirectTo) {
      formData.append('redirectTo', redirectTo)
    }

    try {
      const result = await signUp(formData)
      
      if (result?.error) {
        setError(result.error)
        return
      }
      
      if (result?.requiresEmailConfirmation) {
        setSuccessMessage(
          result.message || 'Te enviamos un email de confirmación. Revisa tu bandeja de entrada para activar tu cuenta.'
        )
        return
      }
      // Si es exitoso, la función signUp redirige automáticamente
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setResendStatus({ type: 'error', message: 'Ingresa tu email para reenviar el correo' })
      return
    }

    setResendLoading(true)
    setResendStatus(null)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const result = await resendVerificationEmail(formData)
      if (result?.error) {
        setResendStatus({ type: 'error', message: result.error })
        return
      }
      setResendStatus({
        type: 'success',
        message: result?.message || 'Email de verificación enviado. Revisa tu bandeja de entrada',
      })
    } catch (err) {
      setResendStatus({ type: 'error', message: 'Ocurrió un error. Por favor intenta de nuevo' })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {successMessage ? (
        <div className="w-full space-y-4">
          <div className="rounded-xl border border-[var(--tp-lines-30)] bg-[var(--tp-bg-light-10)] p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tp-buttons-20)] text-[var(--tp-buttons)]">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Revisa tu correo</p>
                <p className="text-sm text-muted-foreground">{successMessage}</p>
                <p className="text-xs text-muted-foreground">
                  Si no lo ves, revisa spam o correo no deseado.
                </p>
              </div>
            </div>
          </div>

          {resendStatus && (
            <div
              className={`rounded-md border p-3 text-sm ${
                resendStatus.type === 'success'
                  ? 'border-[var(--tp-buttons-20)] bg-[var(--tp-buttons-20)] text-[var(--tp-buttons)]'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}
            >
              {resendStatus.message}
            </div>
          )}

          <Button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white font-medium"
          >
            {resendLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Reenviando...
              </div>
            ) : (
              'Reenviar correo de confirmación'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya confirmaste tu cuenta?{' '}
            <a href="/login" className="text-[var(--tp-buttons)] hover:underline font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="signup-password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="signup-confirm-password">Confirmar contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Creando cuenta...
            </div>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>
      )}

      {!successMessage && (
        <>
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--tp-lines-30)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                O continuar con
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <OAuthButtons mode="signup" redirectTo={redirectTo} />

          {/* Link a Login */}
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" className="text-[var(--tp-buttons)] hover:underline font-medium">
              Inicia sesión
            </a>
          </p>

          {/* Términos */}
          <p className="text-xs text-center text-muted-foreground">
            Al registrarte, aceptas nuestros{' '}
            <a href="/terminos" className="text-[var(--tp-buttons)] hover:underline">
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a href="/privacidad" className="text-[var(--tp-buttons)] hover:underline">
              Política de Privacidad
            </a>
          </p>
        </>
      )}
    </div>
  )
}

