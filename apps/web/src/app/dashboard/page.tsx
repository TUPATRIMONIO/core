import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/DashboardHeader';
import { PricingExample } from '@/components/PricingExample';
import Link from 'next/link';
import { FileText, Globe, Users, ArrowRight } from 'lucide-react';

export default async function Dashboard() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/login')
  }

  // Verificar si es admin
  const { data: isAdmin } = await supabase.rpc('can_access_admin', {
    user_id: data.user.id
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Dashboard" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">¡Bienvenido a TuPatrimonio!</h2>
              <p className="text-gray-600 mb-4">
                Tu plataforma de servicios legales digitales personalizada.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Usuario autenticado</h3>
                  <p className="text-blue-700">Email: {data.user.email}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900">Conexión a Supabase</h3>
                  <p className="text-green-700">✅ Funcionando correctamente</p>
                </div>
              </div>
            </div>

            {/* Secciones de administración */}
            {isAdmin && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Panel de Administración</h2>
                <p className="text-gray-600 mb-6">
                  Accede a las herramientas de gestión de contenido y configuración
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/dashboard/blog"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[var(--tp-buttons)] hover:bg-gray-50 transition-all group"
                  >
                    <FileText className="h-6 w-6 text-[var(--tp-buttons)] mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Blog</h3>
                    <p className="text-sm text-gray-600 mb-2">Gestiona posts y categorías del blog</p>
                    <span className="text-sm text-[var(--tp-buttons)] group-hover:underline inline-flex items-center">
                      Ir al blog <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/pages"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[var(--tp-buttons)] hover:bg-gray-50 transition-all group"
                  >
                    <Globe className="h-6 w-6 text-[var(--tp-buttons)] mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Páginas</h3>
                    <p className="text-sm text-gray-600 mb-2">Controla visibilidad y SEO de páginas</p>
                    <span className="text-sm text-[var(--tp-buttons)] group-hover:underline inline-flex items-center">
                      Gestionar páginas <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/users"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[var(--tp-buttons)] hover:bg-gray-50 transition-all group"
                  >
                    <Users className="h-6 w-6 text-[var(--tp-buttons)] mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Usuarios</h3>
                    <p className="text-sm text-gray-600 mb-2">Administra roles y permisos</p>
                    <span className="text-sm text-[var(--tp-buttons)] group-hover:underline inline-flex items-center">
                      Ver usuarios <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Example of localized pricing */}
            <PricingExample />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Acciones rápidas</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  Nueva firma electrónica
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  Verificar identidad
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  Notarizar documento
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Configuración</h3>
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="text-gray-600">País detectado:</span>
                  <div className="mt-1 text-gray-900 font-medium">Automático</div>
                </div>
                
                <form action="/auth/signout" method="post">
                  <button 
                    type="submit" 
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}