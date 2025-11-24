'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { updatePassword } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let authStateSubscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null
    let timeoutId: NodeJS.Timeout | null = null

    const initializeResetPassword = async () => {
      // Verificar errores en query params primero
      const searchParams = new URLSearchParams(window.location.search)
      const errorParam = searchParams.get('error')
      const errorCode = searchParams.get('error_code')
      const errorDescription = searchParams.get('error_description')
      
      // Verificar errores en hash fragment también
      let hashError = null
      let hashErrorCode = null
      let hashErrorDescription = null
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        hashError = hashParams.get('error')
        hashErrorCode = hashParams.get('error_code')
        hashErrorDescription = hashParams.get('error_description')
      }
      
      // Si hay errores, mostrar mensaje apropiado
      if (errorParam || hashError) {
        const error = errorParam || hashError
        const code = errorCode || hashErrorCode
        const description = errorDescription || hashErrorDescription
        
        let errorMessage = 'El enlace de recuperación no es válido o ha expirado. Por favor solicita uno nuevo.'
        
        if (code === 'otp_expired' || description?.includes('expired')) {
          errorMessage = 'El enlace de recuperación ha expirado. Por favor solicita uno nuevo desde la página de login.'
        } else if (code === 'access_denied' || description?.includes('invalid')) {
          errorMessage = 'El enlace de recuperación no es válido. Por favor solicita uno nuevo desde la página de login.'
        } else if (description) {
          errorMessage = decodeURIComponent(description.replace(/\+/g, ' '))
        }
        
        setError(errorMessage)
        setIsInitializing(false)
        return
      }
      
      // Verificar si hay un hash fragment con access_token (token de recuperación válido)
      const hasHash = window.location.hash && window.location.hash.includes('access_token')
      
      if (hasHash) {
        // Escuchar cambios en el estado de autenticación
        // Supabase procesará automáticamente el hash fragment y disparará eventos
        authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[ResetPassword] Auth state change:', event, { hasSession: !!session })
          
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            // Sesión de recuperación establecida
            if (session && session.user) {
              setHasValidSession(true)
              setIsInitializing(false)
              // Limpiar el hash de la URL para seguridad
              window.history.replaceState(null, '', window.location.pathname)
              
              // Limpiar subscription
              if (authStateSubscription) {
                authStateSubscription.data?.subscription?.unsubscribe()
              }
              if (timeoutId) {
                clearTimeout(timeoutId)
              }
            }
          } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
            // No hay sesión válida
            setError('No se pudo establecer la sesión de recuperación. Por favor solicita un nuevo enlace.')
            setIsInitializing(false)
            
            if (authStateSubscription) {
              authStateSubscription.data?.subscription?.unsubscribe()
            }
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
          }
        })

        // Verificar sesión actual inmediatamente (por si Supabase ya procesó el hash)
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user) {
          setHasValidSession(true)
          setIsInitializing(false)
          window.history.replaceState(null, '', window.location.pathname)
          
          if (authStateSubscription) {
            authStateSubscription.data?.subscription?.unsubscribe()
          }
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          return
        }

        // Timeout de seguridad: si después de 5 segundos no hay sesión, mostrar error
        timeoutId = setTimeout(async () => {
          // Verificar una última vez antes de mostrar error
          const { data: { session } } = await supabase.auth.getSession()
          if (!session || !session.user) {
            console.error('[ResetPassword] Timeout: No se estableció la sesión de recuperación')
            setError('El enlace de recuperación no es válido o ha expirado. Por favor solicita uno nuevo.')
            setIsInitializing(false)
            
            if (authStateSubscription) {
              try {
                if (typeof authStateSubscription.unsubscribe === 'function') {
                  authStateSubscription.unsubscribe()
                } else if (authStateSubscription.data?.subscription?.unsubscribe) {
                  authStateSubscription.data.subscription.unsubscribe()
                }
              } catch (err) {
                console.error('[ResetPassword] Error al hacer unsubscribe en timeout:', err)
              }
            }
          }
        }, 5000)
      } else {
        // No hay hash fragment, verificar si ya hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user) {
          setHasValidSession(true)
        } else {
          setError('No se encontró información de recuperación. Por favor solicita un nuevo enlace desde la página de login.')
        }
        setIsInitializing(false)
      }
    }

    initializeResetPassword()

    // Cleanup
    return () => {
      if (authStateSubscription) {
        try {
          if (typeof authStateSubscription.unsubscribe === 'function') {
            authStateSubscription.unsubscribe()
          } else if (authStateSubscription.data && typeof authStateSubscription.data.subscription?.unsubscribe === 'function') {
            authStateSubscription.data.subscription.unsubscribe()
          }
        } catch (err) {
          console.error('[ResetPassword] Error al hacer unsubscribe:', err)
        }
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

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
    setError('') // Limpiar cualquier error previo

    const formData = new FormData()
    formData.append('password', password)

    try {
      const result = await updatePassword(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        setSuccess(true)
        // Redirección automática después de mostrar el mensaje de éxito
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      console.error('[ResetPassword] Error al actualizar contraseña:', err)
      setError('Ocurrió un error. Por favor intenta de nuevo')
      setLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <main className="bg-[var(--tp-bg-light-10)]">
        <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-[var(--tp-buttons)] border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-medium">Procesando enlace de recuperación...</p>
            </div>
          </div>
        </div>
      </main>
    )
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

  if (!hasValidSession) {
    return (
      <main className="bg-[var(--tp-bg-light-10)]">
        <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Enlace inválido
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm">
                {error || 'El enlace de recuperación no es válido o ha expirado.'}
              </p>
            </div>
            
            <div className="w-full rounded-lg border border-[var(--tp-lines-30)] bg-card p-6">
              <Button
                onClick={() => router.push('/forgot-password')}
                className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
              >
                Solicitar nuevo enlace
              </Button>
            </div>

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
