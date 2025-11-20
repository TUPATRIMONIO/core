'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LoginForm } from '@/components/auth/login-form'

const mapErrorParamToMessage = (errorParam: string | null, messageParam: string | null) => {
  if (errorParam === 'auth') {
    return messageParam ?? 'Error en la autenticación. Por favor, intenta nuevamente.'
  }

  if (errorParam === 'auth_callback_error') {
    return 'Error al verificar el correo. Intenta iniciar sesión de nuevo.'
  }

  return null
}

const isSafeRedirect = (redirectTo: string | null) => {
  if (!redirectTo) return false
  try {
    const url = new URL(redirectTo, 'https://placeholder.local')
    return url.origin === 'https://placeholder.local' && url.pathname.startsWith('/')
  } catch {
    return redirectTo.startsWith('/')
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectParam = searchParams.get('redirect')
  const safeRedirect = isSafeRedirect(redirectParam) ? redirectParam! : '/dashboard'
  const initialError = mapErrorParamToMessage(searchParams.get('error'), searchParams.get('message'))
  const infoMessage = !initialError ? searchParams.get('message') : null

  useEffect(() => {
    let active = true
    const supabase = createClient()

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active || !session) return

      router.replace(safeRedirect)
      router.refresh()
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [router, safeRedirect])

  return (
    <main className="bg-[var(--tp-bg-light-10)]">
      <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--tp-buttons)] font-semibold text-white shadow-[var(--tp-shadow-md)]">
              TP
            </span>
            <p className="text-sm font-medium text-muted-foreground">Tu Tranquilidad, Nuestra Prioridad</p>
          </div>
          <LoginForm
            initialEmail={searchParams.get('email')}
            initialError={initialError}
            initialMessage={infoMessage}
            redirectTo={redirectParam}
          />
        </div>
      </div>
    </main>
  )
}
