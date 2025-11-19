/**
 * Página para seleccionar organización activa
 * Se muestra cuando el usuario tiene múltiples organizaciones
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrganizationSelector } from './OrganizationSelector';

type OrganizationRecord = {
  organization: {
    id: string;
    name: string;
    slug: string;
    org_type: string;
  } | null;
  role: {
    name: string;
    slug: string;
  } | null;
};

export default async function SelectOrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: orgUsers, error } = await supabase
    .schema('core')
    .from('organization_users')
    .select(`
      organization_id,
      role_id,
      organizations!inner(id, name, slug, org_type),
      roles!inner(name, slug)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error cargando organizaciones:', error);
    redirect('/dashboard');
  }

  const organizations = (orgUsers || [])
    .map((item: any) => {
      if (!item.organizations) return null;
      return {
        id: item.organizations.id,
        name: item.organizations.name,
        slug: item.organizations.slug,
        org_type: item.organizations.org_type,
        roleName: item.roles?.name ?? null,
        roleSlug: item.roles?.slug ?? null,
      };
    })
    .filter((org): org is NonNullable<typeof org> => Boolean(org));

  if (organizations.length === 0) {
    redirect('/dashboard');
  }

  const { data: activeOrg } = await supabase
    .rpc('get_user_active_organization', { user_id: user.id })
    .maybeSingle();

  const activeOrgId = activeOrg?.organization_id ?? null;

  // Si solo tiene una organización, la establecemos como activa y vamos directo al dashboard
  if (organizations.length === 1) {
    const onlyOrg = organizations[0];

    if (!activeOrgId || activeOrgId !== onlyOrg.id) {
      const { error: updateError } = await supabase
        .schema('core')
        .from('users')
        .update({ last_active_organization_id: onlyOrg.id })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error estableciendo organización única como activa:', updateError);
      }
    }

    redirect('/dashboard');
  }

  // Si ya existe una organización activa y el usuario viene manualmente, lo llevamos directo al dashboard
  if (activeOrgId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--tp-background-light)] to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--tp-background-dark)] mb-2">
            Selecciona una Organización
          </h1>
          <p className="text-muted-foreground">
            Tienes acceso a múltiples organizaciones. Elige con cuál deseas trabajar.
          </p>
        </div>
        
        <OrganizationSelector
          organizations={organizations}
          activeOrganizationId={activeOrgId}
        />
      </div>
    </div>
  );
}
