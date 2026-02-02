import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentDetailClient } from '@/components/signing/DocumentDetailClient'
import { getUserActiveOrganization } from '@/lib/organization/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    id: string
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;
  
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
  
  // 1. Obtener documento con datos relacionados - filtrar por org activa
  const { data: document, error } = await supabase
    .from('signing_documents_full')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organization.id)
    .single()

  if (error || !document) {
    // Verificar si el documento existe pero en otra organización
    const { data: docExists } = await supabase
      .from('signing_documents')
      .select('id, organization_id')
      .eq('id', id)
      .single()

    if (docExists && docExists.organization_id !== organization.id) {
      // El documento existe pero pertenece a otra organización
      return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Documento de otra organización</CardTitle>
              <CardDescription>
                Este documento pertenece a una organización diferente. Cambia de organización en el selector del sidebar para acceder a él.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard/signing/documents">
                  Volver a mis documentos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // El documento no existe
    if (error?.code === 'PGRST116') {
      notFound()
    }
    
    console.error('Error fetching document:', error)
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Error al cargar documento</CardTitle>
            <CardDescription>
              No se pudo cargar el documento. Por favor, intenta nuevamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/signing/documents">
                Volver a mis documentos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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


