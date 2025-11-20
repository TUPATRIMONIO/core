import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Si es un reset de contraseña, redirigir a la página de reset
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      // Si es verificación de email, redirigir al dashboard
      if (type === 'email_verification' || type === 'signup') {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // Redirigir a la URL especificada
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
