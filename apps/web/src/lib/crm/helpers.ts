/**
 * Helpers del CRM (Server-Side)
 * Funciones utilitarias para el sistema CRM que requieren acceso a la DB.
 * SOLO PARA SERVER COMPONENTS.
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Obtiene el ID de la organización activa del usuario
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  return data?.organization_id || null;
}

/**
 * Verifica si el usuario puede acceder al CRM
 */
export async function canAccessCRM(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase.rpc('can_access_crm', {
    user_id: userId
  });
  
  return data || false;
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export async function hasPermission(
  userId: string,
  resource: 'contacts' | 'companies' | 'deals' | 'tickets' | 'products' | 'quotes',
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<boolean> {
  const supabase = await createClient();
  
  // Obtener rol del usuario en su org
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select(`
      role:roles(slug, level, permissions)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (!orgUser || !orgUser.role) return false;
  
  const role = orgUser.role as any;
  const permissions = role.permissions as any;
  
  // Admin o superior tiene acceso a todo
  if (role.level >= 7) return true;
  
  // Verificar permisos específicos en el rol
  return permissions?.crm?.[resource]?.[action] === true ||
         permissions?.crm?.[resource]?.['*'] === true;
}



