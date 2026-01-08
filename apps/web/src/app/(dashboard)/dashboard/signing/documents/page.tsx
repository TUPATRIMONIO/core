import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { DocumentList } from '@/components/signing/DocumentList'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getUserActiveOrganization } from '@/lib/organization/utils'

export default async function SigningDocumentsPage() {
  const supabase = await createClient()
  
  // Obtener organización activa del usuario
  const { organization } = await getUserActiveOrganization(supabase)

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <p>No se encontró organización</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <PageHeader
        title="Documentos"
        description="Gestiona tus documentos para firma electrónica y notarización"
        actions={
          <Link href="/signing/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Documento
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<Card><CardContent className="p-8 text-center text-muted-foreground">Cargando documentos...</CardContent></Card>}>
        <DocumentListWrapper organizationId={organization.id} />
      </Suspense>
    </div>
  )
}

async function DocumentListWrapper({ organizationId }: { organizationId: string }) {
  const supabase = await createClient()
  
  // Filtrar documentos por la organización activa
  const { data: documents, error } = await supabase
    .from('signing_documents_full')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return <Card><CardContent className="p-6 text-red-500">Error al cargar documentos: {error.message}</CardContent></Card>
  }

  return <DocumentList initialDocuments={documents || []} basePath="/dashboard/signing/documents" />
}


