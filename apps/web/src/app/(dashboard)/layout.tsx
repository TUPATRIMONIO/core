import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar si es platform admin - si lo es, redirigir al admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')

  if (isPlatformAdmin) {
    // Si está intentando acceder a /dashboard, redirigir a /admin
    // Pero permitir acceso a rutas específicas del dashboard si vienen de ahí
    // Por ahora, permitimos acceso a ambas áreas
  }

  // Leer el estado del sidebar de las cookies
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get('sidebar:state')
  const defaultOpen = sidebarState?.value === 'true' ? true : sidebarState?.value === 'false' ? false : true

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

