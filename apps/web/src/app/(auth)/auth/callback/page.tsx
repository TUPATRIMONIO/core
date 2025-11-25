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
    let redirected = false
    let mounted = true

    // Función helper para hacer redirect de forma robusta (solo para OAuth)
    const forceRedirect = (path: string) => {
      if (redirected) return
      redirected = true
      
      console.log(`[forceRedirect] Redirigiendo a: ${path}`)
      
      // Intentar múltiples métodos de redirect
      try {
        window.location.replace(path)
      } catch (e) {
        console.error('[forceRedirect] Error en replace:', e)
        try {
          window.location.href = path
        } catch (e2) {
          console.error('[forceRedirect] Error en href:', e2)
          router.push(path)
        }
      }
    }

    // Función simplificada para procesar autenticación OAuth exitosa
    const processOAuthAuth = async (session: any) => {
      if (redirected || !mounted) return
      
      console.log('[processOAuthAuth] Iniciando procesamiento OAuth...')
      
      try {
        const userId = session.user.id
        console.log('[processOAuthAuth] User ID:', userId)

        // Intentar verificar organización con timeout agresivo
        let hasOrg: boolean | null = null
        
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          
          const { data, error } = await supabase.rpc('user_has_organization', {
            user_id: userId,
          })
          
          clearTimeout(timeoutId)
          
          if (!error) {
            hasOrg = data
            console.log('[processOAuthAuth] Has org:', hasOrg)
          } else {
            console.error('[processOAuthAuth] Error verificando org:', error)
          }
        } catch (orgError) {
          console.error('[processOAuthAuth] Error/timeout en org check:', orgError)
          // Continuar de todas formas
        }

        // Decidir redirect basado en organización
        if (hasOrg === false) {
          console.log('[processOAuthAuth] Redirigiendo a onboarding')
          forceRedirect('/onboarding')
        } else {
          // Si hasOrg es true, null, o hubo error, ir a dashboard
          console.log('[processOAuthAuth] Redirigiendo a dashboard')
          forceRedirect('/dashboard')
        }
      } catch (error) {
        console.error('[processOAuthAuth] Error inesperado:', error)
        // En caso de error, redirigir a dashboard de todas formas
        forceRedirect('/dashboard')
      }
    }

    // Función helper para procesar autenticación exitosa (para OTP y magic links)
    const processSuccessfulAuth = async () => {
      console.log('[processSuccessfulAuth] Iniciando procesamiento de autenticación exitosa')
      
      if (isProcessing) {
        console.log('[processSuccessfulAuth] Ya está procesando, ignorando llamada duplicada')
        return
      }
      isProcessing = true

      // Variable para rastrear si ya se ejecutó el redirect
      let redirectExecuted = false

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
            // Agregar timeout reducido a la llamada RPC para evitar que se cuelgue
            const orgCheckPromise = supabase.rpc(
              'user_has_organization',
              {
                user_id: user.id,
              }
            )
            
            // Timeout reducido de 2 segundos para la verificación de organización
            const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout en verificación de organización')), 2000)
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
                // Redirect inmediato sin esperar a que React actualice el estado
                redirectExecuted = true
                window.location.replace('/onboarding')
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

        // Asegurar que siempre se ejecute el redirect, incluso si hay errores anteriores
        console.log('[processSuccessfulAuth] Redirigiendo a dashboard...')
        redirectExecuted = true
        
        // Usar window.location.replace en lugar de href para evitar que aparezca en el historial
        // y asegurar que el redirect sea inmediato sin esperar a React
        // Forzar el redirect inmediatamente
        window.location.replace('/dashboard')
        
        // Fallback: si por alguna razón el replace no funciona, usar href después de un pequeño delay
        setTimeout(() => {
          if (window.location.pathname === '/auth/callback') {
            console.warn('[processSuccessfulAuth] Replace no funcionó, usando href como fallback')
            window.location.href = '/dashboard'
          }
        }, 500)
      } catch (error: any) {
        // Si ya se ejecutó el redirect, no hacer nada más
        if (redirectExecuted) {
          console.log('[processSuccessfulAuth] Redirect ya ejecutado, ignorando error')
          return
        }

        // Solo mostrar error si es realmente crítico y no podemos continuar
        // Si el usuario ya está autenticado, redirigir de todas formas sin mostrar error
        console.error('[processSuccessfulAuth] Error inesperado:', error)
        
        try {
          // Verificar si hay sesión válida antes de mostrar error
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // Si hay sesión válida, redirigir de todas formas sin mostrar error
            console.log('[processSuccessfulAuth] Hay sesión válida, redirigiendo a pesar del error')
            redirectExecuted = true
            window.location.replace('/dashboard')
            return
          }
        } catch (sessionError) {
          console.error('[processSuccessfulAuth] Error al verificar sesión en catch:', sessionError)
          // Continuar con el flujo de error solo si no hay sesión
        }
        
        // Solo mostrar error si realmente no hay sesión y no se ejecutó redirect
        if (!redirectExecuted) {
          setStatus('error')
          setErrorMessage('Ocurrió un error al procesar tu autenticación. Por favor intenta de nuevo.')
          setTimeout(() => {
            window.location.replace(`/login?error=${encodeURIComponent('Error al procesar autenticación')}`)
          }, 2000)
        }
      } finally {
        // Resetear isProcessing después de un delay para permitir reintentos si es necesario
        setTimeout(() => {
          isProcessing = false
        }, 1000)
      }
    }

    const handleAuthCallback = async () => {
      console.log('[handleAuthCallback] Iniciando manejo de callback de autenticación')
      
      // Manejar OAuth con code (Google, Facebook, GitHub, etc.)
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      
      console.log('[handleAuthCallback] Parámetros de URL:', { 
        hasCode: !!code, 
        type 
      })
      
      // Procesar OAuth si hay code en los query params (indica OAuth social)
      if (code) {
        console.log('[handleAuthCallback] Detectado OAuth social (code presente)')
        isProcessing = true
        
        try {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('[handleAuthCallback] Error en exchange:', exchangeError)
            // Verificar si hay sesión de todas formas
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              await processOAuthAuth(session)
              return
            }
            throw exchangeError
          }

          if (exchangeData.session) {
            await processOAuthAuth(exchangeData.session)
            return
          }
        } catch (err) {
          console.error('[handleAuthCallback] Error en OAuth:', err)
          if (mounted && !redirected) {
            setStatus('error')
            setErrorMessage('Error al autenticar. Por favor intenta de nuevo.')
            setTimeout(() => forceRedirect('/login?error=auth_failed'), 2000)
          }
          return
        }

        // Timeout de emergencia para OAuth: después de 5 segundos, verificar sesión y forzar redirect
        const emergencyTimeout = setTimeout(async () => {
          if (redirected || !mounted) return
          
          console.log('[Emergency] Timeout alcanzado, verificando sesión...')
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            console.log('[Emergency] Sesión encontrada, forzando redirect')
            forceRedirect('/dashboard')
          } else {
            console.error('[Emergency] No hay sesión después del timeout')
            if (mounted) {
              setStatus('error')
              setErrorMessage('No se pudo completar la autenticación.')
              setTimeout(() => forceRedirect('/login?error=timeout'), 2000)
            }
          }
        }, 5000)

        // Cleanup del timeout de emergencia
        return () => {
          clearTimeout(emergencyTimeout)
        }
      }
      
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
            window.location.href = `/login?error=${encodeURIComponent(userFriendlyMessage)}`
          }, 2000)
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
          // No usar await para que el redirect se ejecute inmediatamente
          processSuccessfulAuth().catch((err) => {
            console.error('[onAuthStateChange] Error en processSuccessfulAuth:', err)
            // Si falla, intentar redirect de todas formas
            window.location.replace('/dashboard')
          })
        } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          console.log('[onAuthStateChange] Sesión cerrada o sin sesión después de refresh')
          // Si se cerró sesión o no hay sesión después de refresh, redirigir a login
          if (!isProcessing) {
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              window.location.href = '/login?error=No se pudo establecer la sesión'
            }, 2000)
          }
        }
      })

      // Verificar sesión actual inmediatamente (por si Supabase ya procesó los hash fragments o el code)
      console.log('[handleAuthCallback] Verificando sesión actual inmediatamente...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('[handleAuthCallback] Sesión encontrada inmediatamente, procesando...')
        // No usar await para que el redirect se ejecute inmediatamente
        processSuccessfulAuth().catch((err) => {
          console.error('[handleAuthCallback] Error en processSuccessfulAuth:', err)
          // Si falla, intentar redirect de todas formas
          window.location.replace('/dashboard')
        })
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
                window.location.href = '/login?error=No se encontró información de autenticación'
              }, 2000)
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
      mounted = false
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

