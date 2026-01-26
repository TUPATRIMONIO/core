import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  let cookiesToSet: { name: string; value: string; options?: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(nextCookies) {
          cookiesToSet = nextCookies
          nextCookies.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          nextCookies.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api')

  // No aplicar lógica de auth en rutas públicas de autenticación
  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/register') || 
                      pathname.startsWith('/verify-email') ||
                      pathname.startsWith('/forgot-password') ||
                      pathname.startsWith('/reset-password') ||
                      pathname.startsWith('/onboarding')

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Si el JWT es inválido (usuario no existe), forzar logout global
  // Pero NO redirigir si ya estamos en una ruta de auth (evita loop infinito)
  if (
    userError?.message?.includes('User from sub claim in JWT does not exist')
  ) {
    // Función helper para eliminar cookies de Supabase directamente
    const clearSupabaseCookies = (response: NextResponse) => {
      const allCookies = request.cookies.getAll()
      allCookies.forEach((cookie) => {
        // Eliminar cookies de Supabase (sb-*-auth-token, sb-*-auth-token-code-verifier, etc.)
        if (cookie.name.startsWith('sb-')) {
          response.cookies.delete(cookie.name)
        }
      })
    }

    // Si es API, devolver 401 con cookies limpias
    if (isApiRoute) {
      const response = NextResponse.json(
        { error: 'Sesión expirada, inicia sesión nuevamente.' },
        { status: 401 }
      )
      clearSupabaseCookies(response)
      return response
    }

    // Si ya estamos en ruta de auth, solo limpiar cookies y continuar (no redirigir)
    if (isAuthRoute) {
      clearSupabaseCookies(supabaseResponse)
      return supabaseResponse
    }

    // Si estamos en otra ruta, redirigir a login con mensaje
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set(
      'error',
      'Tu sesión expiró. Inicia sesión nuevamente.'
    )
    const response = NextResponse.redirect(redirectUrl)
    clearSupabaseCookies(response)
    return response
  }

  // Rutas completamente públicas donde no verificamos sesión
  if (isAuthRoute) {
    return supabaseResponse
  }

  // Proteger rutas privadas
  const isPrivateRoute = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/notary') || 
                         pathname.startsWith('/settings')

  // Si no está autenticado e intenta acceder a ruta privada, redirigir a login
  if (!user && isPrivateRoute) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Si está autenticado pero intenta acceder a ruta privada, verificar onboarding
  if (user && isPrivateRoute) {
    try {
      // Verificar si es platform admin primero
      const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
      
      // Si es platform admin, permitir acceso al dashboard sin organización personal
      if (isPlatformAdmin) {
        return supabaseResponse
      }

      // Para usuarios normales, verificar si tienen organización
      const { data: hasOrg } = await supabase.rpc('user_has_organization', {
        user_id: user.id,
      })

      // Si no tiene organización, redirigir a onboarding
      if (!hasOrg) {
        const redirectUrl = new URL('/onboarding', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      // Si hay error al verificar, permitir acceso (mejor UX que bloquear)
      console.error('Error verificando organización en middleware:', error)
    }
  }

  return supabaseResponse
}

