import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layouts/DashboardShell'

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

  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
  if (!isPlatformAdmin) {
    const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
      user_id: user.id,
    })

    if (!activeOrg || activeOrg.length === 0) {
      redirect('/onboarding')
    }
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  )
}
