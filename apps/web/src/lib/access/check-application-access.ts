import { createClient } from '@/lib/supabase/server'
import { isAlwaysVisible } from '@/config/application-routes'

/**
 * Verifica si el usuario actual tiene acceso a una aplicación específica
 * 
 * @param slug - Slug de la aplicación (ej: 'crm_sales')
 * @param options - Opciones opcionales para especificar usuario/organización
 * @returns true si tiene acceso, false si no
 */
export async function checkApplicationAccess(
  slug: string,
  options?: { userId?: string; organizationId?: string }
): Promise<boolean> {
  // Las aplicaciones siempre visibles siempre tienen acceso
  if (isAlwaysVisible(slug)) {
    return true
  }

  const supabase = await createClient()

  // Obtener usuario actual si no se especifica
  let userId = options?.userId
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return false
    }
    userId = user.id
  }

  // Obtener organización del usuario si no se especifica
  let organizationId = options?.organizationId
  if (!organizationId) {
    // Intentar obtener la organización activa del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (orgUser) {
      organizationId = orgUser.organization_id
    }
  }

  // Verificar acceso usando la función RPC
  const { data: hasAccess, error } = await supabase.rpc('can_access_application', {
    p_application_slug: slug,
    p_organization_id: organizationId || null,
    p_user_id: userId || null,
  })

  if (error) {
    console.error('Error checking application access:', error)
    return false
  }

  return hasAccess === true
}

/**
 * Verifica acceso para múltiples aplicaciones de una vez
 * 
 * @param slugs - Array de slugs de aplicaciones
 * @param options - Opciones opcionales
 * @returns Objeto con el resultado de cada slug
 */
export async function checkMultipleApplicationAccess(
  slugs: string[],
  options?: { userId?: string; organizationId?: string }
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  // Verificar todas en paralelo
  await Promise.all(
    slugs.map(async (slug) => {
      results[slug] = await checkApplicationAccess(slug, options)
    })
  )

  return results
}

