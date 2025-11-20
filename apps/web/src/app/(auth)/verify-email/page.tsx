'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle } from 'lucide-react'
import { resendVerificationEmail } from '@/lib/auth/actions'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const result = await resendVerificationEmail(formData)
      
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

  return (
    <main className="bg-[var(--tp-bg-light-10)]">
      <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--tp-buttons-20)] shadow-[var(--tp-shadow-lg)]">
              <Mail className="h-10 w-10 text-[var(--tp-buttons)]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Revisa tu bandeja de entrada
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Te enviamos un email con un link para verificar tu cuenta. 
              Haz clic en el link para activar tu cuenta y empezar a usar TuPatrimonio.
            </p>
          </div>

          {/* Card con instrucciones */}
          <div className="w-full rounded-lg border border-[var(--tp-lines-30)] bg-card p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">¿No recibiste el email?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Revisa tu carpeta de spam o correo no deseado</li>
                <li>Verifica que el email sea correcto</li>
                <li>Espera unos minutos, a veces tarda un poco</li>
              </ul>
            </div>

            {/* Formulario para reenviar */}
            {success ? (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Email enviado. Revisa tu bandeja de entrada.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="resend-email" className="text-sm">
                    Reenviar email de verificación
                  </Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                    required
                    disabled={loading}
                  />
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
                      Enviando...
                    </div>
                  ) : (
                    'Reenviar email'
                  )}
                </Button>
              </form>
            )}
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

