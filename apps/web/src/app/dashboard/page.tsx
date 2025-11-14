import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Icon, IconContainer } from '@tupatrimonio/ui';
import Link from 'next/link';
import { FileText, Globe, Users, ArrowRight, CheckCircle, Zap } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[var(--tp-background-light)] to-background">
      <div className="max-w-7xl mx-auto tp-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome card */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <IconContainer 
                    icon={CheckCircle} 
                    variant="solid-brand" 
                    shape="circle" 
                    size="lg"
                  />
                  <div>
                    <CardTitle className="text-2xl">¡Bienvenido a TuPatrimonio!</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Tu plataforma de servicios legales digitales personalizada
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon icon={Users} size="md" className="text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Usuario autenticado</h3>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm ml-9">Email: {data.user.email}</p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon icon={Zap} size="md" className="text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Conexión a Supabase</h3>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm ml-9">✅ Funcionando correctamente</p>
                </div>
              </CardContent>
            </Card>

            {/* Secciones de administración */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Panel de Administración</CardTitle>
                  <CardDescription className="text-base">
                    Accede a las herramientas de gestión de contenido y configuración
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/dashboard/blog">
                      <Card className="h-full border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                        <CardHeader>
                          <div className="mb-4 group-hover:scale-110 transition-transform">
                            <IconContainer 
                              icon={FileText} 
                              variant="brand" 
                              shape="rounded" 
                              size="lg"
                            />
                          </div>
                          <CardTitle className="text-xl mb-2">Blog</CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            Gestiona posts y categorías del blog
                          </CardDescription>
                          <div className="text-sm text-[var(--tp-brand)] group-hover:underline inline-flex items-center mt-4">
                            Ir al blog <Icon icon={ArrowRight} size="sm" variant="inherit" className="ml-1" />
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>

                    <Link href="/dashboard/pages">
                      <Card className="h-full border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                        <CardHeader>
                          <div className="mb-4 group-hover:scale-110 transition-transform">
                            <IconContainer 
                              icon={Globe} 
                              variant="brand" 
                              shape="rounded" 
                              size="lg"
                            />
                          </div>
                          <CardTitle className="text-xl mb-2">Páginas</CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            Controla visibilidad y SEO de páginas
                          </CardDescription>
                          <div className="text-sm text-[var(--tp-brand)] group-hover:underline inline-flex items-center mt-4">
                            Gestionar páginas <Icon icon={ArrowRight} size="sm" variant="inherit" className="ml-1" />
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>

                    <Link href="/dashboard/users">
                      <Card className="h-full border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                        <CardHeader>
                          <div className="mb-4 group-hover:scale-110 transition-transform">
                            <IconContainer 
                              icon={Users} 
                              variant="brand" 
                              shape="rounded" 
                              size="lg"
                            />
                          </div>
                          <CardTitle className="text-xl mb-2">Usuarios</CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            Administra roles y permisos
                          </CardDescription>
                          <div className="text-sm text-[var(--tp-brand)] group-hover:underline inline-flex items-center mt-4">
                            Ver usuarios <Icon icon={ArrowRight} size="sm" variant="inherit" className="ml-1" />
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full text-left px-4 py-3 text-sm bg-muted hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)] rounded-lg transition-all font-medium border border-transparent hover:border-[var(--tp-brand-20)]">
                  Nueva firma electrónica
                </button>
                <button className="w-full text-left px-4 py-3 text-sm bg-muted hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)] rounded-lg transition-all font-medium border border-transparent hover:border-[var(--tp-brand-20)]">
                  Verificar identidad
                </button>
                <button className="w-full text-left px-4 py-3 text-sm bg-muted hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)] rounded-lg transition-all font-medium border border-transparent hover:border-[var(--tp-brand-20)]">
                  Notarizar documento
                </button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <div className="mt-1 font-medium">{data.user.email}</div>
                </div>
                
                <form action="/auth/signout" method="post">
                  <button 
                    type="submit" 
                    className="w-full px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    Cerrar Sesión
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}