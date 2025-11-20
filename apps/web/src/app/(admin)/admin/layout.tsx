import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/admin/app-sidebar'

export default async function AdminLayout({
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

  // Verificar si es platform admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')

  if (!isPlatformAdmin) {
    redirect('/dashboard')
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main className="flex-1 w-full">
        {children}
      </main>
    </SidebarProvider>
  )
}

