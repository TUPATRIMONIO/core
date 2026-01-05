import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { DocumentReviewClient } from '@/components/admin/document-review-client'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  searchParams: Promise<{
    status?: string
    page?: string
    tab?: string
  }>
}

async function checkAccess() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verificar si el usuario tiene rol document_reviewer o platform_admin
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select(`
      role:roles(slug, level)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')

  const hasAccess = orgUsers?.some((ou: any) => 
    ou.role?.slug === 'document_reviewer' || 
    ou.role?.level >= 9
  )

  if (!hasAccess) {
    redirect('/dashboard')
  }
}

export default async function DocumentReviewPage({ searchParams }: PageProps) {
  await checkAccess()

  const params = await searchParams
  const tab = params.tab || 'pendientes'
  const status = params.status || 'manual_review'
  const page = parseInt(params.page || '1', 10)

  const supabase = createServiceRoleClient()

  const offset = (page - 1) * 20

  let documents: any[] = []
  let count = 0
  let error: any = null

  if (tab === 'historial') {
    // Historial: Todos los documentos que pasaron por revisión (estados post-revisión)
    const statusFilter = [
      'manual_review', 
      'needs_correction', 
      'rejected', 
      'approved', 
      'pending_signature', 
      'signed', 
      'completed', 
      'pending_ai_review', 
      'ai_rejected'
    ]

    const { data, error: histError } = await supabase
      .from('signing_documents')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        organization:organizations(id, name, slug),
        created_by_user:users!signing_documents_created_by_fkey(id, email, full_name),
        ai_review:signing_ai_reviews(
          id,
          status,
          passed,
          confidence_score,
          reasons,
          suggestions,
          completed_at,
          review_type
        ),
        document_messages:signing_document_messages(count)
      `)
      .in('status', statusFilter)
      .order('updated_at', { ascending: false })
      .range(offset, offset + 19)

    const { count: histCount } = await supabase
      .from('signing_documents')
      .select('*', { count: 'exact', head: true })
      .in('status', statusFilter)

    documents = data || []
    count = histCount || 0
    error = histError
  } else {
    // Pendientes: Solo documentos en cola de trabajo
    const statusFilter = status === 'all' 
      ? ['manual_review', 'needs_correction'] 
      : [status]

    const { data, error: pendError } = await supabase
      .from('signing_documents')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        organization:organizations(id, name, slug),
        created_by_user:users!signing_documents_created_by_fkey(id, email, full_name),
        ai_review:signing_ai_reviews(
          id,
          status,
          passed,
          confidence_score,
          reasons,
          suggestions,
          completed_at,
          review_type
        ),
        document_messages:signing_document_messages(count)
      `)
      .in('status', statusFilter)
      .order('updated_at', { ascending: false })
      .range(offset, offset + 19)

    const { count: pendCount } = await supabase
      .from('signing_documents')
      .select('*', { count: 'exact', head: true })
      .in('status', statusFilter)

    documents = data || []
    count = pendCount || 0
    error = pendError
  }

  if (error) {
    console.error('Error fetching documents:', error)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revisión de Documentos"
        description="Revisa y aprueba documentos en proceso de firma electrónica"
      />
      <DocumentReviewClient 
        initialDocuments={documents || []}
        initialTotal={count || 0}
        initialStatus={status}
        initialPage={page}
        initialTab={tab}
      />
    </div>
  )
}

