'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Shield } from 'lucide-react'
import { signInWithEmailOTP, verifyOTP } from '@/lib/auth/actions'

type Step = 'email' | 'verify'

export function EmailOTPForm() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const result = await signInWithEmailOTP(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        setStep('verify')
        setCountdown(60)
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('token', token)

    try {
      const result = await verifyOTP(formData)
      
      // Si hay resultado y tiene error, mostrarlo
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // Si no hay error, el redirect se ejecutó y el usuario será redirigido
      // No necesitamos hacer nada más aquí
    } catch (err: any) {
      // Si el error es un NEXT_REDIRECT, ignorarlo (es normal cuando hay redirect)
      // Next.js usa este mecanismo interno para manejar redirects
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        // No mostrar error, el redirect se está procesando
        // No cambiar loading para que el usuario vea que está procesando
        return // Salir sin mostrar error ni cambiar loading
      }
      
      // Solo mostrar error si NO es un NEXT_REDIRECT
      console.error('Error real en verifyOTP:', err)
      setError('Ocurrió un error. Por favor intenta de nuevo')
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const result = await signInWithEmailOTP(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        setCountdown(60)
        setToken('')
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="otp-email"
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
              Enviando código...
            </div>
          ) : (
            'Enviar código'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Te enviaremos un código de 6 dígitos. Válido por 1 hora.
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp-token">Código de verificación</Label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="otp-token"
            type="text"
            placeholder="123456"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="pl-10 text-center text-lg tracking-widest focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
            maxLength={6}
            required
            disabled={loading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Ingresamos enviamos el código a <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || token.length !== 6}
        className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Verificando...
          </div>
        ) : (
          'Verificar código'
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setToken('')
            setError('')
          }}
          className="text-[var(--tp-buttons)] hover:underline"
        >
          Cambiar email
        </button>

        {countdown > 0 ? (
          <span className="text-muted-foreground">
            Reenviar en {countdown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="text-[var(--tp-buttons)] hover:underline"
          >
            Reenviar código
          </button>
        )}
      </div>
    </form>
  )
}

