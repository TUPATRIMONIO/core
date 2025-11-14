'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * AuthListener - Componente global para escuchar cambios de autenticación
 * Maneja sesiones expiradas, refrescos de token, y cambios de usuario
 */
export function AuthListener() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Usuario cerró sesión
      if (event === 'SIGNED_OUT') {
        router.push('/login')
        router.refresh()
      }
      
      // Token fue refrescado - revalidar datos
      if (event === 'TOKEN_REFRESHED') {
        router.refresh()
      }
      
      // Usuario fue actualizado - revalidar datos
      if (event === 'USER_UPDATED') {
        router.refresh()
      }
      
      // Usuario inició sesión - redirigir si está en login
      if (event === 'SIGNED_IN') {
        if (window.location.pathname === '/login') {
          router.push('/dashboard')
        }
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return null
}


