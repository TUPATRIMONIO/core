/**
 * Layout del Dashboard con navegación
 * Incluye sidebar con acceso a diferentes secciones administrativas
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FileText, Globe, Users, LogOut } from 'lucide-react';

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

              {isAdmin && (
                <>
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
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
