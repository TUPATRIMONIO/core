import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { redirect } from 'next/navigation'
import { GmailConfigClient } from './gmail-config-client'

export default async function GmailConfigPage() {
  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

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
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Configuración Gmail"
          description="Gestiona la cuenta compartida de Gmail para comunicación 1:1"
        />
        <div className="flex-1 px-4 pb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Solo los platform admins pueden configurar cuentas Gmail compartidas.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Obtener organización platform
  const { data: platformOrg } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('org_type', 'platform')
    .eq('status', 'active')
    .single()

  if (!platformOrg) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Configuración Gmail"
          description="Gestiona la cuenta compartida de Gmail para comunicación 1:1"
        />
        <div className="flex-1 px-4 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              No se encontró la organización platform. Contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Obtener cuenta Gmail compartida activa
  const { data: gmailAccount, error: accountError } = await serviceSupabase
    .from('email_accounts')
    .select('id, email_address, display_name, is_active, connected_at, gmail_email_address')
    .eq('organization_id', platformOrg.id)
    .eq('account_type', 'shared')
    .eq('is_active', true)
    .maybeSingle()

  if (accountError && accountError.code !== 'PGRST116') {
    console.error('Error obteniendo cuenta Gmail:', accountError)
  }

  // Obtener usuarios con permisos (si hay cuenta conectada)
  let usersWithPermissions: any[] = []
  if (gmailAccount) {
    const { data: permissions } = await serviceSupabase
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
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Configuración Gmail"
        description="Gestiona la cuenta compartida contacto@tupatrimonio.app para comunicación 1:1"
      />
      <div className="flex-1 px-4 pb-6">
        <GmailConfigClient
          organizationId={platformOrg.id}
          gmailAccount={gmailAccount}
          usersWithPermissions={usersWithPermissions}
        />
      </div>
    </div>
  )
}

