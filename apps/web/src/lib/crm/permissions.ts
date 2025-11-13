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
  
  if (!user) return null;
  
  const { data } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
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



