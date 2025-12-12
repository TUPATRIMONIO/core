import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { NotaryDashboardClient } from '@/components/notary/NotaryDashboardClient'

export default async function NotaryDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener organizaciones activas del usuario
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const orgIds = (orgUsers || []).map((ou) => ou.organization_id).filter(Boolean)
  if (orgIds.length === 0) {
    notFound()
  }

  // Notaría asociada (por organización)
  const { data: office, error: officeError } = await supabase
    .from('signing_notary_offices')
    .select('*')
    .in('organization_id', orgIds)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (officeError || !office) {
    notFound()
  }

  // Asignaciones
  const { data: assignments, error: assignmentsError } = await supabase
    .from('signing_notary_assignments')
    .select('*')
    .eq('notary_office_id', office.id)
    .order('assigned_at', { ascending: false })

  if (assignmentsError) {
    console.error('Error loading assignments:', assignmentsError)
  }

  const assignmentRows = assignments || []
  const documentIds = Array.from(new Set(assignmentRows.map((a: any) => a.document_id).filter(Boolean)))

  const { data: docs } = documentIds.length
    ? await supabase
        .from('signing_documents')
        .select('id, title, organization_id, status, notary_service, created_at')
        .in('id', documentIds)
    : { data: [] as any[] }

  const documentsById = Object.fromEntries((docs || []).map((d: any) => [d.id, d]))

  const orgIdsFromDocs = Array.from(
    new Set((docs || []).map((d: any) => d.organization_id).filter(Boolean))
  )

  const { data: orgs } = orgIdsFromDocs.length
    ? await supabase.from('organizations').select('id, name').in('id', orgIdsFromDocs)
    : { data: [] as any[] }

  const orgsById = Object.fromEntries((orgs || []).map((o: any) => [o.id, o]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Notarial"
        description="Gestiona documentos asignados a tu notaría"
      />

      <NotaryDashboardClient
        officeId={office.id}
        officeName={office.name}
        initialAssignments={assignmentRows}
        documentsById={documentsById}
        orgsById={orgsById}
      />
    </div>
  )
}

