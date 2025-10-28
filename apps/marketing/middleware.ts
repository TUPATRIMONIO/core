import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Países permitidos
const ALLOWED_COUNTRIES = ['cl', 'mx', 'co', 'pe', 'ar'];

export async function middleware(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname;

  // Validar parámetros de país en rutas dinámicas
  const paisMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (paisMatch) {
    const country = paisMatch[1];
    if (!ALLOWED_COUNTRIES.includes(country)) {
      // Redirigir a la página principal si el país no es válido
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Verificar autenticación en rutas /admin
  if (pathname.startsWith('/admin')) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Si no hay sesión, redirect a login
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin, error } = await supabase.rpc(
      'is_platform_admin'
    )

    if (error || !isPlatformAdmin) {
      // No es admin, redirect a home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/:country(cl|mx|co|pe|ar)/:path*',
  ],
}

