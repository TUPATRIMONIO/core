import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAlwaysVisible } from '@/config/application-routes'

/**
 * Middleware helper para proteger API routes verificando acceso a aplicaciones
 * 
 * @param request - Request de Next.js
 * @param applicationSlug - Slug de la aplicación a verificar
 * @returns null si tiene acceso, o NextResponse con error 403 si no tiene acceso
 */
export async function requireApplicationAccess(
  request: NextRequest,
  applicationSlug: string
): Promise<NextResponse | null> {
  // Las aplicaciones siempre visibles siempre tienen acceso
  if (isAlwaysVisible(applicationSlug)) {
    return null
  }

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  // Obtener organización del usuario
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const organizationId = orgUser?.organization_id || null

  // Verificar acceso usando la función RPC
  const { data: hasAccess, error } = await supabase.rpc('can_access_application', {
    p_application_slug: applicationSlug,
    p_organization_id: organizationId,
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error checking application access in API:', error)
    return NextResponse.json(
      { error: 'Error al verificar acceso' },
      { status: 500 }
    )
  }

  if (!hasAccess) {
    return NextResponse.json(
      { 
        error: 'No tienes acceso a esta aplicación',
        application: applicationSlug
      },
      { status: 403 }
    )
  }

  // Tiene acceso, retornar null para continuar
  return null
}

/**
 * Helper para obtener información de la aplicación desde el request
 * Útil cuando la ruta contiene el slug de la aplicación
 * 
 * @param request - Request de Next.js
 * @param routePattern - Patrón de ruta (ej: '/api/crm/:slug')
 * @returns Slug de la aplicación o null
 */
export function getApplicationSlugFromRequest(
  request: NextRequest,
  routePattern?: string
): string | null {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Si hay un patrón, extraer el slug
  if (routePattern) {
    const match = pathname.match(new RegExp(routePattern.replace(':slug', '([^/]+)')))
    return match ? match[1] : null
  }

  // Intentar extraer de rutas comunes
  if (pathname.startsWith('/api/crm')) {
    return 'crm_sales'
  }
  if (pathname.startsWith('/api/signatures')) {
    return 'signatures'
  }
  if (pathname.startsWith('/api/verifications')) {
    return 'verifications'
  }

  return null
}

