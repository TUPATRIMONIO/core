/**
 * Sistema de permisos del CRM
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Obtiene el organization_id del usuario actual
 */
export async function getCurrentUserOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('[getCurrentUserOrgId] No user found');
    return null;
  }
  
  console.log('[getCurrentUserOrgId] Fetching org for user:', user.id);
  
  const { data, error } = await supabase
    .schema('core')
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  console.log('[getCurrentUserOrgId] Query result:', { data, error });
  
  return data?.organization_id || null;
}

/**
 * Verifica si el usuario actual puede acceder al CRM
 */
export async function canUserAccessCRM(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data } = await supabase.rpc('can_access_crm', {
    user_id: user.id
  });
  
  return data || false;
}

/**
 * Obtiene información del usuario y su organización
 */
export async function getCurrentUserWithOrg() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const orgId = await getCurrentUserOrgId();
  
  return {
    user,
    organizationId: orgId
  };
}







