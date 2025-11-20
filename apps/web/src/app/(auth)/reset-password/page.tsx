'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { updatePassword } from '@/lib/auth/actions'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
    formData.append('password', password)

    try {
      const result = await updatePassword(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
      // Si es exitoso, updatePassword redirige automáticamente a /dashboard
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="bg-[var(--tp-bg-light-10)]">
        <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                ¡Contraseña actualizada!
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu contraseña ha sido cambiada exitosamente. Redirigiendo...
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[var(--tp-bg-light-10)]">
      <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tp-buttons-20)] shadow-[var(--tp-shadow-lg)]">
              <Lock className="h-8 w-8 text-[var(--tp-buttons)]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Nueva Contraseña
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Establece una nueva contraseña para tu cuenta
            </p>
          </div>

          {/* Card con formulario */}
          <div className="w-full rounded-lg border border-[var(--tp-lines-30)] bg-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nueva Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
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

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
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
                    Actualizando...
                  </div>
                ) : (
                  'Actualizar Contraseña'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                La contraseña debe tener al menos 6 caracteres. Te recomendamos usar una combinación de letras, números y símbolos.
              </p>
            </form>
          </div>

          {/* Link volver al login */}
          <a
            href="/login"
            className="text-sm text-[var(--tp-buttons)] hover:underline font-medium"
          >
            Volver al login
          </a>
        </div>
      </div>
    </main>
  )
}
