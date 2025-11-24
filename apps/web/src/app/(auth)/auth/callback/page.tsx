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
    const handleAuthCallback = async () => {
      const supabase = createClient()

      // Manejar hash fragments (Magic Link)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
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

        // Mensajes más específicos según el tipo de error
        if (errorCode === 'otp_expired') {
          userFriendlyMessage = 'El enlace ha expirado. Por favor solicita uno nuevo.'
        } else if (errorCode === 'token_not_found') {
          userFriendlyMessage = 'El enlace no es válido. Por favor solicita uno nuevo.'
        } else if (errorDescription) {
          userFriendlyMessage = errorDescription.replace(/\+/g, ' ')
        }

        setStatus('error')
        setErrorMessage(userFriendlyMessage)

        // Redirigir después de mostrar el error
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(userFriendlyMessage)}`)
        }, 3000)
        return
      }

      // Si hay tokens en el hash (Magic Link)
      if (accessToken && refreshToken) {
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
            return
          }

          // Verificar que la sesión se estableció correctamente
          if (!sessionData.session) {
            console.error('No se pudo establecer la sesión')
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          // Esperar un momento para que la sesión se sincronice completamente
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Verificar si tiene organización
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError) {
            console.error('Error al obtener usuario:', userError)
            // Si hay error pero tenemos sesión, intentar continuar de todas formas
            // La sesión puede estar establecida aunque getUser() falle temporalmente
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
                // No bloquear el flujo si falla la verificación de organización
                // El middleware o la página de dashboard pueden manejar esto
              }

              if (!hasOrg) {
                router.push('/onboarding')
                return
              }
            } catch (orgErr) {
              console.error('Error al verificar organización:', orgErr)
              // Continuar al dashboard aunque falle la verificación
            }
          }

          // Redirigir al dashboard
          router.push('/dashboard')
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

      // Manejar query params (OAuth con code)
      const code = searchParams.get('code')
      if (code) {
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

          // Verificar que la sesión se estableció correctamente
          if (!exchangeData.session) {
            console.error('No se pudo establecer la sesión')
            setStatus('error')
            setErrorMessage('No se pudo establecer la sesión. Por favor intenta de nuevo.')
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent('Error al autenticar')}`)
            }, 3000)
            return
          }

          // Esperar un momento para que la sesión se sincronice completamente
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Verificar si tiene organización
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError) {
            console.error('Error al obtener usuario:', userError)
            // Si hay error pero tenemos sesión, intentar continuar de todas formas
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
                // No bloquear el flujo si falla la verificación de organización
              }

              if (!hasOrg) {
                router.push('/onboarding')
                return
              }
            } catch (orgErr) {
              console.error('Error al verificar organización:', orgErr)
              // Continuar al dashboard aunque falle la verificación
            }
          }

          router.push('/dashboard')
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

      // Si no hay ni hash ni code, redirigir a login
      setStatus('error')
      setErrorMessage('No se encontró información de autenticación.')
      setTimeout(() => {
        router.push('/login?error=No se encontró información de autenticación')
      }, 3000)
    }

    handleAuthCallback()
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

