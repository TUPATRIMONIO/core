import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Route Handler para OAuth callbacks (Google, Facebook, etc.)
 * 
 * Este handler maneja OAuth que viene con ?code= en query params.
 * Para Magic Links que vienen con #access_token= en hash fragments,
 * se redirige a la página cliente /auth/callback que los maneja.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  // Solo manejar OAuth con code (no Magic Links)
  // Los Magic Links vienen con hash fragments que no están disponibles en el servidor
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error en callback OAuth:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Error al autenticar')}`, origin)
      )
    }

    // Verificar si tiene organización después de autenticación OAuth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: hasOrg } = await supabase.rpc('user_has_organization', {
        user_id: user.id,
      })

      // Si no tiene organización, redirigir a onboarding
      if (!hasOrg) {
        return NextResponse.redirect(new URL('/onboarding', origin))
      }
    }

    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // Si no hay code, puede ser un Magic Link con hash fragment
  // Redirigir a la página cliente que maneja hash fragments
  return NextResponse.redirect(new URL('/auth/callback', origin))
}

