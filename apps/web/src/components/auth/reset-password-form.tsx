'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle, Clock } from 'lucide-react'
import { resetPassword } from '@/lib/auth/actions'

export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && error) {
      // Limpiar el error cuando el countdown llegue a 0
      setError('')
    }
  }, [countdown, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const result = await resetPassword(formData)
      
      if (result.error) {
        setError(result.error)
        // Activar countdown si hay waitSeconds
        if (result.waitSeconds) {
          setCountdown(result.waitSeconds)
        }
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            ¡Revisa tu email!
          </h3>
          <p className="text-sm text-muted-foreground">
            Te enviamos instrucciones para restablecer tu contraseña a <strong>{email}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            El link expira en 1 hora
          </p>
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.href = '/login'}
          className="w-full"
        >
          Volver al login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
            required
            disabled={loading || countdown > 0}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Ingresa el email asociado a tu cuenta
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          {countdown > 0 && (
            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
              <Clock className="h-4 w-4" />
              <p className="text-xs">
                Podrás solicitar un nuevo enlace en <strong>{countdown}</strong> segundo{countdown !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || countdown > 0}
        className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Enviando instrucciones...
          </div>
        ) : countdown > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Espera {countdown}s
          </div>
        ) : (
          'Restablecer contraseña'
        )}
      </Button>
    </form>
  )
}

