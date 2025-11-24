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
    let checkInterval: NodeJS.Timeout | null = null
    let hashChangeHandler: (() => void) | null = null
    let isProcessing = false

    // Función helper para procesar autenticación exitosa
    const processSuccessfulAuth = async () => {
      // Esperar un momento para que la sesión se sincronice completamente
      await new Promise((resolve) => setTimeout(resolve, 100))

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

    // Función helper para verificar y procesar hash fragments
    const processHashFragments = async (hashString: string): Promise<boolean> => {
      if (isProcessing) return false
      
      const hashParams = new URLSearchParams(hashString)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const error = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')
      const errorCode = hashParams.get('error_code')

      // Si hay error en el hash
      if (error) {
        console.error('Error en callback:', {
          error,
          errorCode,
          errorDescription,
        })

        let userFriendlyMessage = 'Error al autenticar'

        if (errorCode === 'otp_expired') {
          userFriendlyMessage = 'El enlace ha expirado. Por favor solicita uno nuevo.'
        } else if (errorCode === 'token_not_found') {
          userFriendlyMessage = 'El enlace no es válido. Por favor solicita uno nuevo.'
        } else if (errorDescription) {
          userFriendlyMessage = errorDescription.replace(/\+/g, ' ')
        }

        isProcessing = true
        setStatus('error')
        setErrorMessage(userFriendlyMessage)

        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(userFriendlyMessage)}`)
        }, 3000)
        return false
      }

      // Si hay tokens en el hash
      if (accessToken && refreshToken) {
        isProcessing = true
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Error al establecer sesión:', sessionError)
            setStatus('error')
            setErrorMessage('Error al establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return false
          }

          if (!sessionData.session) {
            console.error('No se pudo establecer la sesión')
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return false
          }

          await processSuccessfulAuth()
          return true
        } catch (err) {
          console.error('Error inesperado:', err)
          setStatus('error')
          setErrorMessage('Ocurrió un error inesperado. Por favor intenta de nuevo.')
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
          }, 3000)
          return false
        }
      }

      return false
    }

    const handleAuthCallback = async () => {
      // Manejar hash fragments (Magic Link - Implicit flow o PKCE redirect)
      // Primero verificar si ya hay hash fragments disponibles
      if (window.location.hash) {
        const processed = await processHashFragments(window.location.hash.substring(1))
        if (processed) return
      }

      // Manejar PKCE flow (Magic Link con token_hash en query params)
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (token && type === 'magiclink') {
        isProcessing = true
        try {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink',
          })

          if (verifyError) {
            console.error('Error en verifyOtp (PKCE):', verifyError)
            setStatus('error')
            setErrorMessage('El enlace ha expirado o no es válido. Por favor solicita uno nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('El enlace ha expirado o no es válido')}`)
            }, 3000)
            return
          }

          if (!verifyData.session) {
            console.error('No se pudo establecer la sesión (PKCE)')
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
          console.error('Error inesperado (PKCE):', err)
          setStatus('error')
          setErrorMessage('Ocurrió un error inesperado. Por favor intenta de nuevo.')
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
          }, 3000)
          return
        }
      }

      // Manejar OAuth con code
      const code = searchParams.get('code')
      if (code) {
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

      // Si no hay parámetros de autenticación, puede ser que Supabase esté procesando
      // El enlace va a /auth/v1/verify primero, luego Supabase redirige aquí con hash fragments
      // Esperar y escuchar cambios en el hash antes de mostrar error
      console.log('Esperando redirección de Supabase...', {
        hash: window.location.hash,
        search: window.location.search,
      })

      // Escuchar cambios en el hash (cuando Supabase redirige)
      let hashProcessed = false
      hashChangeHandler = async () => {
        if (window.location.hash && !hashProcessed && !isProcessing) {
          hashProcessed = true
          const processed = await processHashFragments(window.location.hash.substring(1))
          if (processed && hashChangeHandler) {
            window.removeEventListener('hashchange', hashChangeHandler)
          }
        }
      }

      window.addEventListener('hashchange', hashChangeHandler)

      // También verificar periódicamente por si el hash cambia sin disparar el evento
      let attempts = 0
      const maxAttempts = 10 // 5 segundos máximo (500ms * 10)
      checkInterval = setInterval(async () => {
        if (isProcessing) {
          if (checkInterval) clearInterval(checkInterval)
          return
        }

        attempts++

        if (window.location.hash && !hashProcessed) {
          hashProcessed = true
          const processed = await processHashFragments(window.location.hash.substring(1))
          if (processed) {
            if (checkInterval) clearInterval(checkInterval)
            if (hashChangeHandler) {
              window.removeEventListener('hashchange', hashChangeHandler)
            }
            return
          }
        }

        // Si después de varios intentos aún no hay hash, verificar otros métodos
        if (attempts >= maxAttempts) {
          if (checkInterval) clearInterval(checkInterval)
          if (hashChangeHandler) {
            window.removeEventListener('hashchange', hashChangeHandler)
          }

          // Verificar otros métodos de autenticación una última vez
          const codeAfterWait = searchParams.get('code')
          const tokenAfterWait = searchParams.get('token')

          if (!codeAfterWait && !tokenAfterWait && !window.location.hash && !isProcessing) {
            setStatus('error')
            setErrorMessage('No se encontró información de autenticación. Por favor solicita un nuevo link.')
            setTimeout(() => {
              router.push('/login?error=No se encontró información de autenticación')
            }, 3000)
          }
        }
      }, 500) // Verificar cada 500ms
    }

    handleAuthCallback()

    // Cleanup
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      if (hashChangeHandler) {
        window.removeEventListener('hashchange', hashChangeHandler)
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
