import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { NotaryQueueClient } from '@/components/admin/notary-queue-client'

async function checkAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select(`
      role:roles(slug, level)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')

  const hasAccess = orgUsers?.some((ou: any) =>
    ou.role?.slug === 'document_reviewer' || ou.role?.level >= 9
  )

  if (!hasAccess) {
    redirect('/dashboard')
  }
}

export default async function NotaryQueuePage() {
  await checkAccess()

  const supabase = createServiceRoleClient()

  const { data: assignments, error } = await supabase
    .from('signing_notary_assignments')
    .select(`
      id,
      status,
      correction_request,
      rejection_reason,
      assigned_at,
      document:signing_documents(
        id,
        title,
        status,
        order_id,
        organization_id,
        organization:organizations(name)
      ),
      notary_office:signing_notary_offices(name)
    `)
    .in('status', ['needs_correction', 'needs_documents', 'rejected'])
    .order('assigned_at', { ascending: false })

  if (error) {
    console.error('Error loading notary queue:', error)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cola Notarial"
        description="Observaciones y rechazos que deben gestionar el equipo interno"
      />

      <NotaryQueueClient initialAssignments={assignments || []} />
    </div>
  )
}
