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
  FileCheck
} from 'lucide-react';

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

  // Verificar si puede acceder al CRM
  let canCRM = false;
  let crmStats = null;
  
  try {
    const { data: canAccessCRM } = await supabase.rpc('can_access_crm', {
      user_id: user.id
    });
    canCRM = canAccessCRM || false;

    // Obtener estadísticas del CRM si tiene acceso (sin bloquear si falla)
    if (canCRM) {
      try {
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (orgUser) {
          const { data: stats } = await supabase
            .schema('crm')
            .rpc('get_stats', { org_id: orgUser.organization_id });
          crmStats = stats;
        }
      } catch (statsError) {
        console.warn('Could not load CRM stats:', statsError);
      }
    }
  } catch (crmError) {
    console.warn('Could not check CRM access:', crmError);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
                  <h1 className="text-xl font-bold text-gray-900">TuPatrimonio</h1>
                  <p className="text-xs text-gray-500">Dashboard</p>
                </div>
              </Link>
            </div>

            <nav className="flex items-center space-x-4">
              <a 
                href="https://tupatrimonio.app" 
                target="_blank"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Ver Sitio →
              </a>
              <span className="text-sm text-gray-500">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button 
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 mr-3" />
                Inicio
              </Link>

              {canCRM && (
                <>
                  <div className="mt-4 mb-2">
                    <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      CRM
                    </div>
                  </div>
                  
                  <Link
                    href="/dashboard/crm"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-3" />
                    Dashboard CRM
                  </Link>

                  <Link
                    href="/dashboard/crm/contacts"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Contactos
                    {crmStats && crmStats.new_contacts > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-[var(--tp-brand)] text-white rounded-full">
                        {crmStats.new_contacts}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/dashboard/crm/companies"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Building2 className="h-4 w-4 mr-3" />
                    Empresas
                  </Link>

                  <Link
                    href="/dashboard/crm/deals"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Briefcase className="h-4 w-4 mr-3" />
                    Negocios
                  </Link>

                  <Link
                    href="/dashboard/crm/tickets"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Ticket className="h-4 w-4 mr-3" />
                    Tickets
                    {crmStats && crmStats.open_tickets > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                        {crmStats.open_tickets}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/dashboard/crm/products"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Package className="h-4 w-4 mr-3" />
                    Productos
                  </Link>

                  <Link
                    href="/dashboard/crm/quotes"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FileCheck className="h-4 w-4 mr-3" />
                    Cotizaciones
                  </Link>

                  <Link
                    href="/dashboard/crm/emails"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-3" />
                    Emails
                    {crmStats && crmStats.unread_emails > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                        {crmStats.unread_emails}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <div className="mt-4 mb-2">
                    <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Administración
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/dashboard/blog"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      Blog
                    </Link>
                    <Link
                      href="/dashboard/blog/categories"
                      className="flex items-center px-4 py-2 pl-11 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Categorías
                    </Link>
                    <Link
                      href="/dashboard/blog/media"
                      className="flex items-center px-4 py-2 pl-11 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Galería
                    </Link>
                  </div>

                  <Link
                    href="/dashboard/pages"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Globe className="h-4 w-4 mr-3" />
                    Páginas
                  </Link>

                  <Link
                    href="/dashboard/users"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Usuarios
                  </Link>
                </>
              )}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-h-[calc(100vh-200px)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

