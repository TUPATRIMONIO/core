import { createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentViewer } from './DocumentViewer'

function isUuid(input: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)
}

function isQrIdentifier(input: string) {
  return /^DOC-[0-9A-F]{8,}-[0-9A-F]{8,}$/i.test(input)
}

export default async function RepositoryDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>
}) {
  const { documentId } = await params

  // Validar que sea UUID o QR identifier
  if (!isUuid(documentId) && !isQrIdentifier(documentId)) notFound()

  const service = createServiceRoleClient()

  // Buscar por UUID o por qr_identifier
  let doc
  if (isUuid(documentId)) {
    const { data } = await service
      .from('signing_documents')
      .select('id, title, status, created_at, organization_id, order_id, original_file_path, qr_identifier')
      .eq('id', documentId)
      .maybeSingle()
    doc = data
  } else {
    // Es un QR identifier
    const { data } = await service
      .from('signing_documents')
      .select('id, title, status, created_at, organization_id, order_id, original_file_path, qr_identifier')
      .eq('qr_identifier', documentId)
      .maybeSingle()
    doc = data
  }

  if (!doc) notFound()

  // Obtener firmantes
  const { data: signers } = await service
    .from('signing_signers')
    .select('id, name, email, status, signing_order')
    .eq('document_id', doc.id)
    .neq('status', 'removed')
    .order('signing_order', { ascending: true })

  // Obtener información del pedido si existe
  let orderNumber = null
  if (doc.order_id) {
    const { data: order } = await service
      .from('orders')
      .select('order_number')
      .eq('id', doc.order_id)
      .maybeSingle()
    orderNumber = order?.order_number
  }

  // Obtener todas las versiones disponibles del documento
  type DocumentVersion = {
    name: string
    bucket: string
    path: string
    url: string | null
    type: 'original' | 'signed' | 'notarized'
  }

  const versions: DocumentVersion[] = []

  // 1. Documento notarizado (si existe)
  const { data: assignment } = await service
    .from('signing_notary_assignments')
    .select('status, notarized_file_path, completed_at')
    .eq('document_id', doc.id)
    .maybeSingle()

  if (assignment?.notarized_file_path && assignment.status === 'completed') {
    const { data: urlData } = await service.storage
      .from('docs-notarized')
      .createSignedUrl(assignment.notarized_file_path, 3600)
    
    versions.push({
      name: 'Documento Notarizado',
      bucket: 'docs-notarized',
      path: assignment.notarized_file_path,
      url: urlData?.signedUrl || null,
      type: 'notarized'
    })
  }

  // 2. Documento firmado (versión fully_signed más reciente)
  const { data: signedVersion } = await service
    .from('signing_document_versions')
    .select('file_path, version_type, version_number')
    .eq('document_id', doc.id)
    .eq('version_type', 'fully_signed')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (signedVersion?.file_path) {
    const { data: urlData } = await service.storage
      .from('docs-signed')
      .createSignedUrl(signedVersion.file_path, 3600)
    
    versions.push({
      name: 'Documento Firmado',
      bucket: 'docs-signed',
      path: signedVersion.file_path,
      url: urlData?.signedUrl || null,
      type: 'signed'
    })
  }

  // 3. Documento original (si existe)
  if (doc.original_file_path) {
    const { data: urlData } = await service.storage
      .from('docs-originals')
      .createSignedUrl(doc.original_file_path, 3600)
    
    versions.push({
      name: 'Documento Original',
      bucket: 'docs-originals',
      path: doc.original_file_path,
      url: urlData?.signedUrl || null,
      type: 'original'
    })
  }

  // Seleccionar versión por defecto (prioridad: notarizado > firmado > original)
  const defaultVersion = versions.find(v => v.type === 'notarized') 
    || versions.find(v => v.type === 'signed')
    || versions.find(v => v.type === 'original')

  return (
    <DocumentViewer
      documentTitle={doc.title || 'Documento'}
      documentId={doc.qr_identifier || doc.id}
      status={doc.status || 'unknown'}
      orderNumber={orderNumber}
      signers={signers || []}
      versions={versions}
      defaultVersion={defaultVersion}
    />
  )
}


