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

  // Refrescar la sesión del usuario si existe
  // IMPORTANTE: Obtener usuario debe ser una operación de solo lectura, 
  // no debe escribir en la sesión. Usar getUser() en lugar de getSession() 
  // para evitar issues con las cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/auth', '/404']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Manejo de la raíz (/)
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    if (user) {
      // Usuario autenticado, ir al dashboard
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    } else {
      // No autenticado, ir al login
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Proteger rutas del dashboard (requieren autenticación)
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      // No autenticado, redirigir a login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const isSelectingOrganization = pathname.startsWith('/dashboard/select-organization')

    if (!isSelectingOrganization) {
      // Verificar si el usuario tiene organización activa
      const { data: userProfile } = await supabase
        .schema('core')
        .from('users')
        .select('last_active_organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!userProfile?.last_active_organization_id) {
        const { data: memberships, error: membershipsError } = await supabase
          .schema('core')
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (!membershipsError && memberships) {
          if (memberships.length === 0) {
            // Usuario sin organizaciones, redirigir a onboarding
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
          } else if (memberships.length === 1) {
            const singleOrgId = memberships[0]?.organization_id
            if (singleOrgId) {
              await supabase
                .schema('core')
                .from('users')
                .update({ last_active_organization_id: singleOrgId })
                .eq('id', user.id)
            }
          } else if (memberships.length > 1) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/select-organization'
            return NextResponse.redirect(url)
          }
        }
      }
    }

    // Verificar si tiene acceso admin para rutas específicas de administración
    const adminRoutes = ['/dashboard/pages', '/dashboard/blog', '/dashboard/users'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isAdminRoute) {
      const { data: hasAdminAccess, error } = await supabase.rpc('can_access_admin', {
        user_id: user.id
      });

      if (error || !hasAdminAccess) {
        // No tiene acceso admin, redirigir al dashboard principal
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Usuario autenticado, permitir acceso
    return supabaseResponse
  }

  // Si está autenticado y trata de acceder a login, redirigir a dashboard
  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Proteger otras rutas (todo excepto rutas públicas)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

