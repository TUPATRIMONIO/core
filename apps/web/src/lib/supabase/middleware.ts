import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // No aplicar lógica de auth en rutas públicas de autenticación
  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/register') || 
                      pathname.startsWith('/verify-email') ||
                      pathname.startsWith('/forgot-password') ||
                      pathname.startsWith('/reset-password')

  // Rutas completamente públicas donde no verificamos sesión
  if (isAuthRoute) {
    // Refrescar la sesión si existe, pero no redirigir automáticamente
    await supabase.auth.getUser()
    return supabaseResponse
  }

  // Para rutas privadas, verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas privadas
  const isPrivateRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/notary')

  // Si no está autenticado e intenta acceder a ruta privada, redirigir a login
  if (!user && isPrivateRoute) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

