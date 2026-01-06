import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { DocumentReviewDetailClient } from '@/components/admin/document-review-detail-client'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

async function checkAccess() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
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
    ou.role?.slug === 'document_reviewer' || 
    ou.role?.level >= 9
  )

  if (!hasAccess) {
    redirect('/dashboard')
  }
}

export default async function DocumentReviewDetailPage({ params }: PageProps) {
  await checkAccess()

  const { id } = await params
  const supabase = createServiceRoleClient()

  // Obtener documento completo usando la vista que es más robusta
  const { data: document, error: docError } = await supabase
    .from('signing_documents_full')
    .select('*')
    .eq('id', id)
    .single()

  if (docError || !document) {
    console.error('Error fetching document detail:', docError)
    redirect('/admin/document-review')
  }

  // Enriquecer con ai_review detallada si no está en la vista completa
  const { data: aiReview } = await supabase
    .from('signing_ai_reviews')
    .select('*')
    .eq('document_id', id)
    .maybeSingle()

  if (aiReview) {
    document.ai_review = [aiReview]
  }

  // Obtener mensajes
  const { data: messages } = await supabase
    .from('signing_document_messages')
    .select(`
      *,
      user:users(id, email, full_name)
    `)
    .eq('document_id', id)
    .order('created_at', { ascending: true })

  // Obtener firmantes
  const { data: signers } = await supabase
    .from('signing_signers')
    .select('*')
    .eq('document_id', id)
    .order('signing_order', { ascending: true })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Revisar: ${document.title}`}
        description={`Documento de ${document.organization?.name || 'organización desconocida'}`}
      />
      <DocumentReviewDetailClient
        document={document}
        messages={messages || []}
        signers={signers || []}
      />
    </div>
  )
}

