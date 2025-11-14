/**
 * Helpers de organizaciones (server-side)
 */

import { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ResolveActiveOrgResult = {
  organizationId: string | null;
  needsSelection: boolean;
};

async function fetchMemberships(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data: memberships, error } = await supabase
    .schema('core')
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching organization memberships:', error);
    return [] as Array<{ organization_id: string }>;
  }

  return memberships ?? [];
}

export async function resolveActiveOrganizationId(
  supabase: SupabaseServerClient,
  userId: string
): Promise<ResolveActiveOrgResult> {
  const { data: activeOrg } = await supabase
    .rpc('get_user_active_organization', { user_id: userId })
    .maybeSingle();

  if (activeOrg?.organization_id) {
    return {
      organizationId: activeOrg.organization_id as string,
      needsSelection: false,
    };
  }

  const memberships = await fetchMemberships(supabase, userId);

  if (memberships.length === 0) {
    return {
      organizationId: null,
      needsSelection: false,
    };
  }

  if (memberships.length === 1) {
    const fallbackOrgId = memberships[0]?.organization_id;
    if (fallbackOrgId) {
      const { error: updateError } = await supabase
        .schema('core')
        .from('users')
        .update({ last_active_organization_id: fallbackOrgId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error setting fallback organization:', updateError);
      }
    }

    return {
      organizationId: fallbackOrgId ?? null,
      needsSelection: false,
    };
  }

  return {
    organizationId: null,
    needsSelection: true,
  };
}
