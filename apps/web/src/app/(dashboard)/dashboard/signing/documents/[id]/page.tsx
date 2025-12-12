import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentDetailClient } from '@/components/signing/DocumentDetailClient'

interface PageProps {
  params: {
    id: string
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;
  
  const supabase = await createClient()
  
  // 1. Obtener documento con datos relacionados
  const { data: document, error } = await supabase
    .from('signing_documents_full')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !document) {
    if (error?.code === 'PGRST116') { // Not found
      notFound()
    }
    console.error('Error fetching document:', error)
    return <div>Error al cargar el documento</div>
  }

  // 2. Obtener firmantes ordenados
  const { data: signers } = await supabase
    .from('signing_signers_ordered')
    .select('*')
    .eq('document_id', id)
    .order('signing_order', { ascending: true })

  // 3. Obtener revisores
  const { data: reviewers } = await supabase
    .from('signing_reviewers')
    .select('*, user:core.users(full_name, email)')
    .eq('document_id', id)

  return (
    <div className="px-4 pb-6">
      <DocumentDetailClient 
        initialDocument={document} 
        initialSigners={signers || []}
        initialReviewers={reviewers || []}
        basePath="/dashboard/signing/documents"
      />
    </div>
  )
}

