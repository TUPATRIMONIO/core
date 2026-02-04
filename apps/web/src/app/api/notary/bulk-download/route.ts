import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import archiver from 'archiver'
import { Readable } from 'stream'

/**
 * POST /api/notary/bulk-download
 * Descarga masiva de documentos en formato ZIP
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const service = createServiceRoleClient()

    // 1. Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Identificar notaría del usuario
    const { data: orgUsers } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const orgIds = (orgUsers || []).map((ou) => ou.organization_id).filter(Boolean)

    if (orgIds.length === 0) {
      return NextResponse.json({ error: 'No tienes una organización activa' }, { status: 403 })
    }

    const { data: office } = await supabase
      .from('signing_notary_offices')
      .select('id, organization_id, name')
      .in('organization_id', orgIds)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!office) {
      return NextResponse.json({ error: 'No tienes acceso al portal notarial' }, { status: 403 })
    }

    // 3. Obtener lista de documentIds del body
    const body = await req.json()
    const { documentIds } = body

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'documentIds requerido y debe ser un array' }, { status: 400 })
    }

    if (documentIds.length > 50) {
      return NextResponse.json({ error: 'Máximo 50 documentos por descarga' }, { status: 400 })
    }

    // 4. Verificar acceso a cada documento (que tenga asignación a esta notaría)
    const { data: assignments } = await service
      .from('signing_notary_assignments')
      .select('document_id')
      .eq('notary_office_id', office.id)
      .in('document_id', documentIds)

    const accessibleDocIds = new Set((assignments || []).map((a) => a.document_id))

    // Solo procesar los que tienen acceso
    const validDocIds = documentIds.filter((id) => accessibleDocIds.has(id))

    if (validDocIds.length === 0) {
      return NextResponse.json({ error: 'No tienes acceso a ninguno de los documentos solicitados' }, { status: 403 })
    }

    // 5. Crear ZIP en memoria
    const archive = archiver('zip', {
      zlib: { level: 6 }, // Nivel de compresión
    })

    const chunks: Buffer[] = []

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      archive.on('error', (err) => {
        reject(err)
      })
    })

    // 6. Para cada documento, obtener archivo y agregarlo al ZIP
    let filesAdded = 0

    for (const documentId of validDocIds) {
      try {
        // Obtener información del documento
        const { data: doc } = await service
          .from('signing_documents')
          .select('id, title, original_file_path')
          .eq('id', documentId)
          .maybeSingle()

        if (!doc) continue

        // Determinar bucket y path (prioridad: notarizado > firmado > original)
        let bucket: string | null = null
        let path: string | null = null

        // 1. Buscar archivo notarizado
        const { data: assignment } = await service
          .from('signing_notary_assignments')
          .select('status, notarized_file_path')
          .eq('document_id', documentId)
          .maybeSingle()

        if (assignment?.notarized_file_path && assignment.status === 'completed') {
          bucket = 'docs-notarized'
          path = assignment.notarized_file_path
        } else {
          // 2. Buscar versión firmada
          const { data: signedVersion } = await service
            .from('signing_document_versions')
            .select('file_path')
            .eq('document_id', documentId)
            .eq('version_type', 'fully_signed')
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (signedVersion?.file_path) {
            bucket = 'docs-signed'
            path = signedVersion.file_path
          } else if (doc.original_file_path) {
            // 3. Fallback a original
            bucket = 'docs-originals'
            path = doc.original_file_path
          }
        }

        if (!bucket || !path) continue

        // Descargar archivo desde Supabase Storage
        const { data: fileData, error: downloadError } = await service.storage
          .from(bucket)
          .download(path)

        if (downloadError || !fileData) {
          console.error(`Error downloading ${documentId}:`, downloadError)
          continue
        }

        // Convertir a Buffer
        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Generar nombre de archivo único
        const sanitizedTitle = (doc.title || documentId)
          .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '')
          .substring(0, 100)
        const fileName = `${sanitizedTitle}.pdf`

        // Agregar al ZIP
        archive.append(buffer, { name: fileName })
        filesAdded++
      } catch (error) {
        console.error(`Error processing document ${documentId}:`, error)
        // Continuar con el siguiente documento
        continue
      }
    }

    if (filesAdded === 0) {
      return NextResponse.json({ error: 'No se pudo descargar ningún documento' }, { status: 500 })
    }

    // Finalizar el archivo ZIP
    archive.finalize()

    // Esperar a que se complete el ZIP
    const zipBuffer = await archivePromise

    // 7. Retornar el ZIP como respuesta
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="documentos-notaria-${Date.now()}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('[bulk-download] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar descarga masiva' },
      { status: 500 }
    )
  }
}
