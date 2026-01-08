import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layouts/DashboardShell'
import { PublicShell } from '@/components/layouts/PublicShell'
import { SigningWizardProvider } from '@/components/signing/wizard/WizardContext'

export default async function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const content = <SigningWizardProvider>{children}</SigningWizardProvider>

  if (user) {
    return <DashboardShell>{content}</DashboardShell>
  }

  return <PublicShell>{content}</PublicShell>
}

