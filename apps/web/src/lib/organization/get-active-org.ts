import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene la organización activa del usuario usando la función RPC
 * que respeta last_active_organization_id
 */
export async function getActiveOrganizationId(
  supabase: SupabaseClient,
  userId: string
): Promise<{ organizationId: string | null; error: string | null }> {
  const { data: activeOrg, error } = await supabase.rpc(
    'get_user_active_organization',
    { user_id: userId }
  );

  if (error) {
    console.error('Error obteniendo organización activa:', error);
    return { organizationId: null, error: 'Error al obtener organización' };
  }

  if (!activeOrg || activeOrg.length === 0) {
    return { organizationId: null, error: 'Usuario no tiene organización activa' };
  }

  return { organizationId: activeOrg[0].organization_id, error: null };
}
