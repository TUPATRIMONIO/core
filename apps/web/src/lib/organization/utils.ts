import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene la organización activa del usuario.
 * Si el usuario es platform admin pero no tiene organización personal,
 * devuelve la organización platform "TuPatrimonio".
 */
export async function getUserActiveOrganization(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { organization: null, error: 'No autenticado' };
  }

  // Verificar si es platform admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');

  // Intentar obtener organización activa del usuario
  const { data: activeOrg, error: orgError } = await supabase.rpc(
    'get_user_active_organization',
    {
      user_id: user.id,
    }
  );

  // Si tiene organización activa, usarla
  if (activeOrg && activeOrg.length > 0) {
    return {
      organization: {
        id: activeOrg[0].organization_id,
        name: activeOrg[0].organization_name,
        slug: activeOrg[0].organization_slug,
        type: activeOrg[0].organization_type,
      },
      error: null,
    };
  }

  // Si es platform admin y no tiene organización personal, obtener organización platform
  // Los platform admins siempre están en organization_users con la organización platform
  if (isPlatformAdmin) {
    // Obtener todas las organizaciones del usuario (incluyendo platform)
    const { data: userOrgs } = await supabase
      .from('organization_users')
      .select('organization_id, organizations(id, name, slug, org_type)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (userOrgs && userOrgs.length > 0) {
      // Buscar organización platform primero
      const platformOrgUser = userOrgs.find(
        (ou: any) => ou.organizations?.org_type === 'platform'
      );
      
      if (platformOrgUser && platformOrgUser.organizations) {
        const org = platformOrgUser.organizations;
        return {
          organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            type: org.org_type,
          },
          error: null,
        };
      }

      // Si no hay platform org en la lista, usar la primera organización disponible
      const firstOrg = userOrgs[0];
      if (firstOrg && firstOrg.organizations) {
        const org = firstOrg.organizations;
        return {
          organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            type: org.org_type,
          },
          error: null,
        };
      }
    }
  }

  // Si no tiene organización y no es platform admin, retornar error
  return {
    organization: null,
    error: orgError || 'Usuario no tiene organización asignada',
  };
}

/**
 * Obtiene el usuario y su organización activa.
 * Útil para API routes que necesitan ambos.
 */
export async function getUserAndOrganization(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, organization: null, error: { message: 'No autenticado' } };
  }

  const orgResult = await getUserActiveOrganization(supabase);

  if (orgResult.error) {
    return {
      user,
      organization: null,
      error: { message: orgResult.error },
    };
  }

  return {
    user,
    organization: orgResult.organization,
    error: null,
  };
}

