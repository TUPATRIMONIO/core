import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para el navegador (Client Components)
 * Maneja cookies automáticamente para mantener la sesión
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

