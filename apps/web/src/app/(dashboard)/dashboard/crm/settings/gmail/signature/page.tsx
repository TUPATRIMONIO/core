import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CrmSignatureEditor } from '@/components/crm/gmail/CrmSignatureEditor'
import { getUserActiveOrganization } from '@/lib/organization/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CrmSignaturePage() {
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

  return (
    <div className="flex-1 px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/crm/settings/gmail">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Firma de Correo</h1>
          <p className="text-muted-foreground">
            Configura tu firma personal para los correos enviados
          </p>
        </div>
      </div>
      <CrmSignatureEditor organizationId={organization.id} />
    </div>
  )
}



