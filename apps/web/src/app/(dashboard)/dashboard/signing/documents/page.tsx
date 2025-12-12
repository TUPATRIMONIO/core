import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { DocumentList } from '@/components/signing/DocumentList'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default async function SigningDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>No autorizado</div>
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <PageHeader
        title="Documentos"
        description="Gestiona tus documentos para firma electrónica y notarización"
        actions={
          <Link href="/dashboard/signing/documents/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Documento
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<Card><CardContent className="p-8 text-center text-muted-foreground">Cargando documentos...</CardContent></Card>}>
        <DocumentListWrapper />
      </Suspense>
    </div>
  )
}

async function DocumentListWrapper() {
  const supabase = await createClient()
  
  // Obtener documentos del usuario/organización usando la vista pública
  const { data: documents, error } = await supabase
    .from('signing_documents_full')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return <Card><CardContent className="p-6 text-red-500">Error al cargar documentos: {error.message}</CardContent></Card>
  }

  return <DocumentList initialDocuments={documents || []} basePath="/dashboard/signing/documents" />
}

