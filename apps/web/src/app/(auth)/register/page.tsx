'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignupForm } from '@/components/auth/signup-form'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    let active = true
    const supabase = createClient()

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active || !session) return

      router.replace('/dashboard')
      router.refresh()
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
            <p className="text-sm font-medium text-muted-foreground">Tu Tranquilidad, Nuestra Prioridad</p>
          </div>
          <SignupForm />
        </div>
      </div>
    </main>
  )
}

