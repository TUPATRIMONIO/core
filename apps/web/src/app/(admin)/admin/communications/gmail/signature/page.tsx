import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { redirect } from 'next/navigation'
import { SignatureEditor } from './signature-editor'

export default async function SignaturePage() {
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

  let organizationId: string | null = null

  if (isPlatformAdmin) {
    // Si es platform admin, obtener la organización platform
    const { data: platformOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('org_type', 'platform')
      .eq('status', 'active')
      .single()

    if (platformOrg) {
      organizationId = platformOrg.id
    } else {
      // Si no existe la org platform, buscar cualquier organización del usuario
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single()

      if (orgUser) {
        organizationId = orgUser.organization_id
      }
    }
  } else {
    // Usuario normal: obtener su organización activa
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (orgUser) {
      organizationId = orgUser.organization_id
    }
  }

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Mi Firma de Email"
          description="Configura tu firma personal para emails enviados desde la cuenta compartida"
        />
        <div className="flex-1 px-4 pb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              No se pudo encontrar una organización para configurar tu firma.
              {isPlatformAdmin && ' Como platform admin, deberías tener acceso a la organización platform.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Mi Firma de Email"
        description="Configura tu firma personal para emails enviados desde contacto@tupatrimonio.app"
      />
      <div className="flex-1 px-4 pb-6">
        <SignatureEditor organizationId={organizationId} />
      </div>
    </div>
  )
}

