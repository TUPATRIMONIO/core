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
    let authStateSubscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let isProcessing = false

    // Función helper para procesar autenticación exitosa
    const processSuccessfulAuth = async () => {
      console.log('[processSuccessfulAuth] Iniciando procesamiento de autenticación exitosa')
      
      if (isProcessing) {
        console.log('[processSuccessfulAuth] Ya está procesando, ignorando llamada duplicada')
        return
      }
      isProcessing = true

      try {
        // Esperar un momento para que la sesión se sincronice completamente
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Verificar si tiene organización
        console.log('[processSuccessfulAuth] Obteniendo usuario...')
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log('[processSuccessfulAuth] Resultado de getUser:', { 
          hasUser: !!user, 
          userId: user?.id,
          userEmail: user?.email,
          hasError: !!userError,
          error: userError 
        })

        if (userError) {
          console.error('[processSuccessfulAuth] Error al obtener usuario:', userError)
          // Continuar de todas formas si hay sesión
        }

        if (user) {
          console.log('[processSuccessfulAuth] Usuario obtenido:', { id: user.id, email: user.email })
          console.log('[processSuccessfulAuth] Verificando organización...')
          
          try {
            // Agregar timeout a la llamada RPC para evitar que se cuelgue
            const orgCheckPromise = supabase.rpc(
              'user_has_organization',
              {
                user_id: user.id,
              }
            )
            
            // Timeout de 5 segundos para la verificación de organización
            const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout en verificación de organización')), 5000)
            )
            
            console.log('[processSuccessfulAuth] Esperando respuesta de RPC...')
            let hasOrg: boolean | null = null
            let orgError: any = null
            
            try {
              const result = await Promise.race([
                orgCheckPromise,
                timeoutPromise
              ]) as { data: boolean | null; error: any }
              
              hasOrg = result.data
              orgError = result.error
              
              console.log('[processSuccessfulAuth] Respuesta de RPC recibida:', { hasOrg, orgError })
            } catch (raceError: any) {
              console.error('[processSuccessfulAuth] Error en Promise.race:', raceError)
              orgError = raceError
              // Si hay timeout o error, continuar de todas formas
            }

            if (orgError) {
              console.error('[processSuccessfulAuth] Error al verificar organización:', orgError)
              // Continuar de todas formas - redirigir a dashboard si hay error
              // El usuario puede completar onboarding después si es necesario
            } else {
              console.log('[processSuccessfulAuth] Usuario tiene organización:', hasOrg)

              if (hasOrg === false) {
                console.log('[processSuccessfulAuth] Usuario sin organización, redirigiendo a onboarding...')
                router.push('/onboarding')
                return
              }
            }
          } catch (orgErr) {
            console.error('[processSuccessfulAuth] Error al verificar organización (catch):', orgErr)
            // Continuar de todas formas - redirigir a dashboard
            // El usuario puede completar onboarding después si es necesario
          }
        } else {
          console.warn('[processSuccessfulAuth] No se encontró usuario, pero continuando...')
        }

        console.log('[processSuccessfulAuth] Redirigiendo a dashboard...')
        router.push('/dashboard')
      } catch (error) {
        console.error('[processSuccessfulAuth] Error inesperado:', error)
        setStatus('error')
        setErrorMessage('Ocurrió un error al procesar tu autenticación. Por favor intenta de nuevo.')
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent('Error al procesar autenticación')}`)
        }, 3000)
      } finally {
        // Resetear isProcessing después de un delay para permitir reintentos si es necesario
        setTimeout(() => {
          isProcessing = false
        }, 1000)
      }
    }

    const handleAuthCallback = async () => {
      console.log('[handleAuthCallback] Iniciando manejo de callback de autenticación')
      
      // Manejar OAuth con code SOLO si viene de un provider social
      const code = searchParams.get('code')
      const providerToken = searchParams.get('provider_token')
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      
      console.log('[handleAuthCallback] Parámetros de URL:', { 
        hasCode: !!code, 
        hasProviderToken: !!providerToken,
        hasTokenHash: !!tokenHash,
        type 
      })
      
      // Manejar Magic Link con PKCE flow (token_hash en query params)
      if (tokenHash && type === 'email') {
        console.log('[handleAuthCallback] Detectado Magic Link con PKCE (token_hash)')
        isProcessing = true
        try {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email',
          })

          if (verifyError) {
            console.error('[handleAuthCallback] Error en verifyOtp:', verifyError)
            setStatus('error')
            setErrorMessage('El enlace no es válido o ha expirado. Por favor solicita uno nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Enlace inválido o expirado')}`)
            }, 3000)
            return
          }

          if (!verifyData.session) {
            console.error('[handleAuthCallback] No se pudo establecer la sesión después de verifyOtp')
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al establecer sesión')}`)
            }, 3000)
            return
          }

          console.log('[handleAuthCallback] Sesión establecida con verifyOtp, procesando autenticación...')
          await processSuccessfulAuth()
          return
        } catch (err) {
          console.error('[handleAuthCallback] Error inesperado en verifyOtp:', err)
          setStatus('error')
          setErrorMessage('Ocurrió un error inesperado. Por favor intenta de nuevo.')
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
          }, 3000)
          return
        }
      }
      
      // Solo procesar OAuth si hay code Y provider_token (indicador de OAuth social)
      if (code && providerToken) {
        console.log('[handleAuthCallback] Detectado OAuth social (code + provider_token)')
        isProcessing = true
        try {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('[handleAuthCallback] Error en exchangeCodeForSession:', exchangeError)
            setStatus('error')
            setErrorMessage('Error al autenticar. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          if (!exchangeData.session) {
            console.error('[handleAuthCallback] No se pudo establecer la sesión')
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          console.log('[handleAuthCallback] Sesión establecida con exchangeCodeForSession, procesando autenticación...')
          await processSuccessfulAuth()
          return
        } catch (err) {
          console.error('[handleAuthCallback] Error inesperado en exchangeCodeForSession:', err)
          setStatus('error')
          setErrorMessage('Ocurrió un error inesperado. Por favor intenta de nuevo.')
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
          }, 3000)
          return
        }
      }
      
      // Manejar Magic Link con code pero sin provider_token (PKCE flow)
      // Con PKCE, necesitamos usar exchangeCodeForSession para procesar el code
      if (code && !providerToken) {
        console.log('[handleAuthCallback] Detectado Magic Link (code sin provider_token) - Procesando con exchangeCodeForSession...')
        isProcessing = true
        try {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('[handleAuthCallback] Error en exchangeCodeForSession (Magic Link):', exchangeError)
            setStatus('error')
            setErrorMessage('Error al autenticar. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          if (!exchangeData.session) {
            console.error('[handleAuthCallback] No se pudo establecer la sesión (Magic Link)')
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          console.log('[handleAuthCallback] Sesión establecida con exchangeCodeForSession (Magic Link), procesando autenticación...')
          await processSuccessfulAuth()
          return
        } catch (err) {
          console.error('[handleAuthCallback] Error inesperado en exchangeCodeForSession (Magic Link):', err)
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
      console.log('[handleAuthCallback] Configurando listener de cambios de autenticación...')
      authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[onAuthStateChange] Evento:', event, { hasSession: !!session, userId: session?.user?.id })

        // Manejar INITIAL_SESSION también (puede tener sesión válida)
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          console.log('[onAuthStateChange] Usuario autenticado, procesando...')
          // Limpiar timeout si existe
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          await processSuccessfulAuth()
        } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          console.log('[onAuthStateChange] Sesión cerrada o sin sesión después de refresh')
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

      // Verificar sesión actual inmediatamente (por si Supabase ya procesó los hash fragments o el code)
      console.log('[handleAuthCallback] Verificando sesión actual inmediatamente...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('[handleAuthCallback] Sesión encontrada inmediatamente, procesando...')
        await processSuccessfulAuth()
        return
      } else {
        console.log('[handleAuthCallback] No hay sesión inmediata, esperando evento SIGNED_IN...')
      }

      // Timeout de seguridad reducido: si después de 2 segundos no hay sesión, mostrar error
      timeoutId = setTimeout(() => {
        console.log('[handleAuthCallback] Timeout alcanzado, verificando sesión una última vez...')
        if (!isProcessing) {
          // Verificar una última vez antes de mostrar error
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              console.error('[handleAuthCallback] No se encontró sesión después del timeout')
              setStatus('error')
              setErrorMessage('No se encontró información de autenticación. Por favor solicita un nuevo link.')
              setTimeout(() => {
                router.push('/login?error=No se encontró información de autenticación')
              }, 3000)
            } else {
              console.log('[handleAuthCallback] Sesión encontrada en verificación final, procesando...')
              processSuccessfulAuth()
            }
          })
        } else {
          console.log('[handleAuthCallback] Ya está procesando, ignorando timeout')
        }
      }, 2000) // Reducido de 3000 a 2000 ms
    }

    handleAuthCallback()

    // Cleanup
    return () => {
      if (authStateSubscription) {
        try {
          // onAuthStateChange retorna un objeto con unsubscribe directamente
          if (typeof authStateSubscription.unsubscribe === 'function') {
            authStateSubscription.unsubscribe()
          } else if (authStateSubscription.data && typeof authStateSubscription.data.unsubscribe === 'function') {
            authStateSubscription.data.unsubscribe()
          }
        } catch (err) {
          console.error('[cleanup] Error al hacer unsubscribe:', err)
        }
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

