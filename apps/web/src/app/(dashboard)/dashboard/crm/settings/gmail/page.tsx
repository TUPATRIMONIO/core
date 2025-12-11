import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CrmGmailConfigClient } from '@/components/crm/gmail/CrmGmailConfigClient'
import { getUserActiveOrganization } from '@/lib/organization/utils'

export default async function CrmGmailSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { organization } = await getUserActiveOrganization(supabase)

  if (!organization) {
    return <div>No se encontró organización activa</div>
  }

  // Obtener cuenta Gmail compartida activa
  const { data: gmailAccount } = await supabase
    .from('email_accounts')
    .select('id, email_address, display_name, is_active, connected_at, gmail_email_address')
    .eq('organization_id', organization.id)
    .eq('account_type', 'shared')
    .eq('is_active', true)
    .maybeSingle()

  // Obtener usuarios con permisos
  let usersWithPermissions: any[] = []
  if (gmailAccount) {
    const { data: permissions } = await supabase
      .from('email_account_permissions')
      .select(`
        id,
        user_id,
        can_send,
        can_receive,
        is_default,
        user:users!email_account_permissions_user_id_fkey(id, email, first_name, last_name)
      `)
      .eq('email_account_id', gmailAccount.id)
      .is('revoked_at', null)

    usersWithPermissions = permissions || []
  }

  return (
    <div className="flex-1 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración Gmail</h1>
        <p className="text-muted-foreground">
          Gestiona la cuenta compartida para comunicación 1:1
        </p>
      </div>
      <CrmGmailConfigClient
        organizationId={organization.id}
        gmailAccount={gmailAccount}
        usersWithPermissions={usersWithPermissions}
      />
    </div>
  )
}
