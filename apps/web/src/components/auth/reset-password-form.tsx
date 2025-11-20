'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle } from 'lucide-react'
import { resetPassword } from '@/lib/auth/actions'

export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
            disabled={loading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Ingresa el email asociado a tu cuenta
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Enviando instrucciones...
          </div>
        ) : (
          'Restablecer contraseña'
        )}
      </Button>
    </form>
  )
}

