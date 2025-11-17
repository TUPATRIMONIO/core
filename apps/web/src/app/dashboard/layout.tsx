/**
 * Layout del Dashboard con navegación
 * Incluye sidebar con acceso a diferentes secciones administrativas
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  Globe, 
  Users, 
  LogOut,
  Mail,
  Building2,
  Briefcase,
  Ticket,
  Package,
  FileCheck,
  Settings
} from 'lucide-react';
import { OrganizationSwitcher, type OrganizationSummary } from './OrganizationSwitcher';
import { DashboardSidebar } from './DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar si es admin para mostrar opciones adicionales
  const { data: isAdmin } = await supabase.rpc('can_access_admin', {
    user_id: user.id
  });

  const { data: memberships, error: membershipsError } = await supabase
    .schema('core')
    .from('organization_users')
    .select('organization_id, role_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  let organizations: OrganizationSummary[] = [];

  if (!membershipsError && memberships && memberships.length > 0) {
    const organizationIds = Array.from(
      new Set(
        memberships
          .map((entry: any) => entry.organization_id as string | null)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (organizationIds.length > 0) {
      const roleIds = Array.from(
        new Set(
          memberships
            .map((entry: any) => entry.role_id as string | null)
            .filter((id): id is string => Boolean(id))
        )
      );

      let rolesMap = new Map<string, string>();

      if (roleIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .schema('core')
          .from('roles')
          .select('id, name')
          .in('id', roleIds);

        if (!rolesError && rolesData) {
          rolesMap = new Map(rolesData.map((role) => [role.id as string, role.name as string]));
        }
      }

      const { data: orgDetails, error: orgDetailsError } = await supabase
        .schema('core')
        .from('organizations')
        .select('id, name, slug, org_type')
        .in('id', organizationIds);

      if (!orgDetailsError && orgDetails) {
        organizations = organizationIds
          .map((orgId) => {
            const found = orgDetails.find((org) => org.id === orgId);
            if (!found) return null;
            const membership = memberships.find((entry: any) => entry.organization_id === orgId);

            return {
              id: found.id as string,
              name: (found.name || found.slug || 'Organización') as string,
              slug: (found.slug || found.name || found.id.slice(0, 8)) as string,
              orgType: (found.org_type || 'business') as string,
              roleName: membership?.role_id ? rolesMap.get(membership.role_id as string) ?? null : null,
            } satisfies OrganizationSummary;
          })
          .filter(Boolean) as OrganizationSummary[];
      }
    }
  }

  const { data: activeOrg } = await supabase
    .rpc('get_user_active_organization', { user_id: user.id })
    .maybeSingle();

  const activeOrganizationId = activeOrg?.organization_id ?? null;

  // Verificar si puede acceder al CRM
  let canCRM = false;
  let crmStats = null;
  
  try {
    const { data: canAccessCRM } = await supabase.rpc('can_access_crm', {
      user_id: user.id
    });
    canCRM = canAccessCRM || false;

    // Obtener estadísticas del CRM si tiene acceso (sin bloquear si falla)
    if (canCRM && activeOrganizationId) {
      try {
        const { data: stats } = await supabase
          .schema('crm')
          .rpc('get_stats', { org_id: activeOrganizationId });
        crmStats = stats;
      } catch (statsError) {
        console.warn('Could not load CRM stats:', statsError);
      }
    }
  } catch (crmError) {
    console.warn('Could not check CRM access:', crmError);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[var(--tp-buttons)] rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">TuPatrimonio</h1>
                  <p className="text-xs text-muted-foreground">Dashboard</p>
                </div>
              </Link>
            </div>

            <nav className="flex flex-wrap items-center justify-end gap-3">
              {organizations.length > 0 && (
                <OrganizationSwitcher
                  organizations={organizations}
                  activeOrganizationId={activeOrganizationId}
                />
              )}
              <a 
                href="https://tupatrimonio.app" 
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver Sitio →
              </a>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button 
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8">
        <div className="flex gap-4">
          {/* Sidebar Colapsable */}
          <DashboardSidebar canCRM={canCRM} isAdmin={isAdmin || false} crmStats={crmStats} />

          {/* Main content */}
          <main className="flex-1 min-h-[calc(100vh-200px)] pb-28 md:pb-32 pr-2 md:pr-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
