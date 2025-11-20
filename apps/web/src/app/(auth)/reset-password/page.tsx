'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Verificar si hay un token de recuperación válido
    const checkToken = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidToken(true)
      } else {
        setError('Token de recuperación inválido o expirado')
      }
    }

    checkToken()
  }, [])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'La contraseña debe contener al menos una mayúscula'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'La contraseña debe contener al menos una minúscula'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'La contraseña debe contener al menos un número'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      const passwordError = validatePassword(password)
      if (passwordError) {
        throw new Error(passwordError)
      }

      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      console.error('Error resetting password:', err)
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken && error) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Enlace inválido</CardTitle>
          <CardDescription>
            El enlace de recuperación es inválido o ha expirado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Por favor, solicita un nuevo enlace de recuperación
          </p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Solicitar nuevo enlace</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Volver al inicio de sesión</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">¡Contraseña restablecida!</CardTitle>
          <CardDescription>
            Tu contraseña ha sido actualizada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Serás redirigido al inicio de sesión en unos segundos...
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Ir al inicio de sesión</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-[var(--tp-brand)] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 pr-10 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Cancelar</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

