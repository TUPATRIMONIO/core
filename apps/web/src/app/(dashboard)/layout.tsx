import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PendingOrdersBadge } from '@/components/checkout/PendingOrdersBadge'
import { GlobalCountryProvider } from '@/providers/GlobalCountryProvider'
import { CountrySelectorDropdown } from '@/components/shared/CountrySelectorDropdown'
import { OrganizationProvider } from '@/providers/OrganizationProvider'
import { CreditBadge } from '@/components/billing/CreditBadge'

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

  // Los platform admins pueden acceder tanto al dashboard como al admin panel
  // No hay restricción aquí - pueden usar ambas áreas según necesiten

  // Leer el estado del sidebar de las cookies
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get('sidebar:state')
  const defaultOpen = sidebarState?.value === 'true' ? true : sidebarState?.value === 'false' ? false : true

  return (
    <OrganizationProvider>
      <GlobalCountryProvider>
        <TooltipProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <DashboardSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex-1" />
                <CreditBadge className="mr-2" />
                <CountrySelectorDropdown variant="compact" showReset />
                <PendingOrdersBadge />
              </header>
              <div className="flex-1 px-4 md:px-6">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </GlobalCountryProvider>
    </OrganizationProvider>
  )
}

