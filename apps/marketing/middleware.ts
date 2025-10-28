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

  // Lógica de redirect por país para páginas específicas (Vercel geo-routing)
  const needsCountryRedirect = [
    '/firmas-electronicas',
    '/notaria-digital', 
    '/verificacion-identidad',
    '/precios'
  ].includes(pathname);

  if (needsCountryRedirect) {
    // Vercel proporciona headers de geolocalización
    const country = request.geo?.country?.toLowerCase() || 
                   request.headers.get('x-vercel-ip-country')?.toLowerCase();
    
    const supportedCountries = ['cl', 'mx', 'co'];
    const targetCountry = supportedCountries.includes(country || '') 
      ? country 
      : 'cl';

    const newUrl = new URL(`/${targetCountry}${pathname}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(newUrl, 302);
  }

  // Validar parámetros de país en rutas dinámicas
  const paisMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (paisMatch) {
    const country = paisMatch[1];
    if (!ALLOWED_COUNTRIES.includes(country)) {
      // Redirigir a la página principal si el país no es válido
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // La app marketing ya no tiene admin - solo contenido público
  // La verificación de acceso a páginas se maneja en los componentes PageAccessWrapper

  return supabaseResponse
}

export const config = {
  matcher: [
    '/:country(cl|mx|co|pe|ar)/:path*',
    // Rutas que necesitan redirect por país
    '/firmas-electronicas',
    '/notaria-digital',
    '/verificacion-identidad', 
    '/precios',
  ],
}

