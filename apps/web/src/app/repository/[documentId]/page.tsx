import { createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function isUuid(input: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)
}

export default async function RepositoryDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>
}) {
  const { documentId } = await params

  if (!isUuid(documentId)) notFound()

  const service = createServiceRoleClient()

  const { data: doc } = await service
    .from('signing_documents')
    .select('id, title, status, created_at, organization_id')
    .eq('id', documentId)
    .maybeSingle()

  if (!doc) notFound()

  // Prioridad: notarizado (si existe), luego firmado
  let bucket: string | null = null
  let path: string | null = null

  const { data: assignment } = await service
    .from('signing_notary_assignments')
    .select('status, notarized_file_path, completed_at')
    .eq('document_id', documentId)
    .maybeSingle()

  if (assignment?.notarized_file_path && assignment.status === 'completed') {
    bucket = 'docs-notarized'
    path = assignment.notarized_file_path
  } else {
    // Buscar versión fully_signed más reciente
    const { data: signedVersion } = await service
      .from('signing_document_versions')
      .select('file_path, version_type, version_number')
      .eq('document_id', documentId)
      .eq('version_type', 'fully_signed')
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (signedVersion?.file_path) {
      bucket = 'docs-signed'
      path = signedVersion.file_path
    }
  }

  let signedUrl: string | null = null
  if (bucket && path) {
    const { data } = await service.storage.from(bucket).createSignedUrl(path, 60)
    signedUrl = data?.signedUrl || null
  }

  const statusLabel = doc.status?.toString?.() || 'unknown'

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Repositorio de Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Documento</div>
            <div className="text-sm font-semibold">{doc.title || doc.id}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">ID</div>
              <div className="text-xs font-mono break-all">{doc.id}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Estado</div>
              <div className="text-sm font-semibold">{statusLabel}</div>
            </div>
          </div>

          <Separator />

          {signedUrl ? (
            <div className="space-y-2">
              <div className="text-sm">Puedes descargar el último documento disponible.</div>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer nofollow">
                <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                  Descargar PDF
                </Button>
              </a>
              <div className="text-xs text-muted-foreground">
                Este enlace expira en 60 segundos.
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Aún no hay un documento firmado/notariado disponible para descarga.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Este repositorio es público y se valida por el ID del documento.
      </div>
    </div>
  )
}

