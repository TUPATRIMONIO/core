import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { redirect } from 'next/navigation'
import { InboxClient } from './inbox-client'

export default async function InboxPage() {
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
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Inbox"
          description="Bandeja de entrada de tickets"
        />
        <div className="flex-1 px-4 pb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Solo los platform admins pueden acceder al inbox de tickets.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Inbox"
        description="Tickets y conversaciones de email"
      />
      <div className="flex-1 px-4 pb-6">
        <InboxClient />
      </div>
    </div>
  )
}

