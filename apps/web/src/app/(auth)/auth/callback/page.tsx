'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    let authStateSubscription: { unsubscribe: () => void } | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let isProcessing = false

    // Función helper para procesar autenticación exitosa
    const processSuccessfulAuth = async () => {
      if (isProcessing) return
      isProcessing = true

      // Esperar un momento para que la sesión se sincronice completamente
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Verificar si tiene organización
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error('Error al obtener usuario:', userError)
        // Continuar de todas formas si hay sesión
      }

      if (user) {
        try {
          const { data: hasOrg, error: orgError } = await supabase.rpc(
            'user_has_organization',
            {
              user_id: user.id,
            }
          )

          if (orgError) {
            console.error('Error al verificar organización:', orgError)
          }

          if (!hasOrg) {
            router.push('/onboarding')
            return
          }
        } catch (orgErr) {
          console.error('Error al verificar organización:', orgErr)
        }
      }

      router.push('/dashboard')
    }

    const handleAuthCallback = async () => {
      // Manejar OAuth con code SOLO si viene de un provider social
      const code = searchParams.get('code')
      const providerToken = searchParams.get('provider_token')
      
      // Solo procesar OAuth si hay code Y provider_token (indicador de OAuth social)
      if (code && providerToken) {
        isProcessing = true
        try {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Error en exchangeCodeForSession:', exchangeError)
            setStatus('error')
            setErrorMessage('Error al autenticar. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          if (!exchangeData.session) {
            console.error('No se pudo establecer la sesión')
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          await processSuccessfulAuth()
          return
        } catch (err) {
          console.error('Error inesperado:', err)
          setStatus('error')
          setErrorMessage('Ocurrió un error inesperado. Por favor intenta de nuevo.')
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
          }, 3000)
          return
        }
      }

      // Para Magic Links: Supabase procesa automáticamente los hash fragments
      // cuando se inicializa el cliente. Solo necesitamos escuchar cuando la sesión cambia.
      
      // Verificar si hay errores en el hash
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const error = hashParams.get('error')
        const errorCode = hashParams.get('error_code')
        const errorDescription = hashParams.get('error_description')

        if (error) {
          let userFriendlyMessage = 'Error al autenticar'
          if (errorCode === 'otp_expired') {
            userFriendlyMessage = 'El enlace ha expirado. Por favor solicita uno nuevo.'
          } else if (errorCode === 'token_not_found') {
            userFriendlyMessage = 'El enlace no es válido. Por favor solicita uno nuevo.'
          } else if (errorDescription) {
            userFriendlyMessage = errorDescription.replace(/\+/g, ' ')
          }

          setStatus('error')
          setErrorMessage(userFriendlyMessage)
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent(userFriendlyMessage)}`)
          }, 3000)
          return
        }
      }

      // Escuchar cambios en el estado de autenticación
      // Supabase procesará automáticamente los hash fragments y disparará este evento
      authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, { hasSession: !!session })

        if (event === 'SIGNED_IN' && session) {
          // Limpiar timeout si existe
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          await processSuccessfulAuth()
        } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          // Si se cerró sesión o no hay sesión después de refresh, redirigir a login
          if (!isProcessing) {
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push('/login?error=No se pudo establecer la sesión')
            }, 3000)
          }
        }
      })

      // Verificar sesión actual inmediatamente (por si Supabase ya procesó los hash fragments)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await processSuccessfulAuth()
        return
      }

      // Timeout de seguridad: si después de 3 segundos no hay sesión, mostrar error
      timeoutId = setTimeout(() => {
        if (!isProcessing) {
          // Verificar una última vez antes de mostrar error
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              setStatus('error')
              setErrorMessage('No se encontró información de autenticación. Por favor solicita un nuevo link.')
              setTimeout(() => {
                router.push('/login?error=No se encontró información de autenticación')
              }, 3000)
            }
          })
        }
      }, 3000)
    }

    handleAuthCallback()

    // Cleanup
    return () => {
      if (authStateSubscription) {
        authStateSubscription.unsubscribe()
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--tp-background-light)]">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' ? (
          <>
            <div className="w-12 h-12 border-4 border-[var(--tp-buttons)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Autenticando...</p>
            <p className="text-sm text-muted-foreground">
              Por favor espera mientras procesamos tu solicitud
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
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
            <p className="text-red-600 dark:text-red-400 font-medium">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">
              Redirigiendo al inicio de sesión...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[var(--tp-background-light)]">
          <div className="text-center space-y-4 p-8">
            <div className="w-12 h-12 border-4 border-[var(--tp-buttons)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Cargando...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}

