'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    let active = true
    const supabase = createClient()

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Solo redirigir si hay una sesión válida
        if (active && session && !error) {
          router.replace('/dashboard')
          router.refresh()
        }
      } catch (error) {
        // Si hay error al verificar sesión, permitir acceso a la página
        console.log('Error checking session:', error)
      }
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [router])

  return (
    <main className="bg-[var(--tp-bg-light-10)]">
      <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--tp-buttons)] font-semibold text-white shadow-[var(--tp-shadow-md)]">
              TP
            </span>
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Tu Tranquilidad, Nuestra Prioridad
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
