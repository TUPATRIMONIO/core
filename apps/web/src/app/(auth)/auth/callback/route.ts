import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error en callback:', error)
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
  }

  // Redirigir al dashboard después de autenticación exitosa
  return NextResponse.redirect(new URL('/dashboard', origin))
}

