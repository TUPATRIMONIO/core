/**
 * Mapeo de rutas del admin a slugs de aplicaciones en la base de datos
 * 
 * Este archivo centraliza la relación entre las rutas del frontend
 * y las aplicaciones registradas en core.applications
 */

export const APPLICATION_ROUTES: Record<string, string> = {
  // CRM - Solo entidades core
  '/admin/crm': 'crm_sales',
  '/dashboard/crm/contacts': 'crm_sales',
  '/dashboard/crm/companies': 'crm_sales',
  '/dashboard/crm/deals': 'crm_sales',
  '/dashboard/crm/tickets': 'crm_sales',
  '/dashboard/crm/products': 'crm_sales',
  
  // Email Marketing - Campañas y templates de email
  '/dashboard/communications/email/campaigns': 'email_marketing',
  '/dashboard/communications/email/templates': 'email_marketing',
  
  // Communications - Listas y analytics compartidos (controlados por email_marketing por ahora)
  '/dashboard/communications/lists': 'email_marketing',
  '/dashboard/communications/analytics': 'email_marketing',
  
  // Otras apps
  '/admin/signatures': 'signatures',
  '/admin/verifications': 'verifications',
  '/admin/ai-customer-service': 'ai_customer_service',
  '/admin/ai-document-review': 'ai_document_review',
  '/admin/analytics': 'analytics',
  // Agregar futuras apps aquí
}

/**
 * Aplicaciones que siempre deben estar visibles
 * independientemente de su estado is_active
 */
export const ALWAYS_VISIBLE_SLUGS = ['marketing_site']

/**
 * Obtiene el slug de aplicación basado en una ruta
 * @param pathname - Ruta completa (ej: '/admin/crm/deals')
 * @returns Slug de la aplicación o null si no hay mapeo
 */
export function getApplicationSlugFromRoute(pathname: string): string | null {
  // Buscar la ruta más larga que coincida (para rutas anidadas)
  const sortedRoutes = Object.keys(APPLICATION_ROUTES).sort((a, b) => b.length - a.length)
  
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return APPLICATION_ROUTES[route]
    }
  }
  
  return null
}

/**
 * Verifica si una aplicación siempre debe estar visible
 * @param slug - Slug de la aplicación
 * @returns true si siempre debe estar visible
 */
export function isAlwaysVisible(slug: string): boolean {
  return ALWAYS_VISIBLE_SLUGS.includes(slug)
}

