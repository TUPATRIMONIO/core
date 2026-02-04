import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * GET /api/notary/document-info?documentId=xxx
 * Obtiene información del documento para visualización (bucket y path)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const service = createServiceRoleClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'documentId requerido' }, { status: 400 })
    }

    // Verificar que el usuario tiene acceso (es de una notaría)
    const { data: orgUsers } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const orgIds = (orgUsers || []).map((ou) => ou.organization_id).filter(Boolean)

    if (orgIds.length === 0) {
      return NextResponse.json({ error: 'No tienes acceso' }, { status: 403 })
    }

    // Verificar que existe una notaría asociada
    const { data: office } = await supabase
      .from('signing_notary_offices')
      .select('id')
      .in('organization_id', orgIds)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!office) {
      return NextResponse.json({ error: 'No tienes acceso al portal notarial' }, { status: 403 })
    }

    // Obtener información del documento
    const { data: doc } = await service
      .from('signing_documents')
      .select('id, title, status, original_file_path')
      .eq('id', documentId)
      .maybeSingle()

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Prioridad: notarizado (si existe), luego firmado, luego original
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
      // 2. Buscar versión fully_signed más reciente
      const { data: signedVersion } = await service
        .from('signing_document_versions')
        .select('file_path, version_type')
        .eq('document_id', documentId)
        .eq('version_type', 'fully_signed')
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (signedVersion?.file_path) {
        bucket = 'docs-signed'
        path = signedVersion.file_path
      } else if (doc.original_file_path) {
        // 3. Fallback a documento original
        bucket = 'docs-originals'
        path = doc.original_file_path
      }
    }

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'No hay archivo disponible para este documento' },
        { status: 404 }
      )
    }

    // Generar URL firmada usando service role (ya validamos el acceso arriba)
    const { data: urlData, error: urlError } = await service.storage
      .from(bucket)
      .createSignedUrl(path, 3600)

    if (urlError || !urlData?.signedUrl) {
      console.error('[document-info] Error generating signed URL:', urlError)
      return NextResponse.json(
        { error: 'No se pudo generar URL de acceso al documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      documentId: doc.id,
      title: doc.title,
      bucket,
      path,
      signedUrl: urlData.signedUrl,
    })
  } catch (error: any) {
    console.error('[document-info] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener información del documento' },
      { status: 500 }
    )
  }
}
