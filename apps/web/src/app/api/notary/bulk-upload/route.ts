import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

const MAX_FILES = 50
const MAX_TOTAL_SIZE = 500 * 1024 * 1024 // 500MB

/**
 * POST /api/notary/bulk-upload
 * Subida masiva de documentos notarizados
 * Los archivos se guardan temporalmente y se procesan de forma asíncrona
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
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (orgUsersError) {
      return NextResponse.json({ error: orgUsersError.message }, { status: 400 })
    }

    const orgIds = (orgUsers || []).map((ou) => ou.organization_id).filter(Boolean)
    if (orgIds.length === 0) {
      return NextResponse.json({ error: 'No tienes una organización activa' }, { status: 403 })
    }

    const { data: office, error: officeError } = await supabase
      .from('signing_notary_offices')
      .select('id, organization_id, name')
      .in('organization_id', orgIds)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (officeError || !office) {
      return NextResponse.json({ error: 'No tienes acceso al portal notarial' }, { status: 403 })
    }

    // 3. Parsear archivos del FormData
    const formData = await req.formData()
    const files: File[] = []
    let totalSize = 0

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.type === 'application/pdf') {
        files.push(value)
        totalSize += value.size
      }
    }

    // 4. Validar límites
    if (files.length === 0) {
      return NextResponse.json({ error: 'No se recibieron archivos PDF' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES} archivos por lote` },
        { status: 400 }
      )
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: `Tamaño total máximo: ${MAX_TOTAL_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // 5. Crear batch en BD
    const { data: batch, error: batchError } = await service
      .from('signing_notary_upload_batches')
      .insert({
        notary_office_id: office.id,
        uploaded_by: user.id,
        status: 'pending',
        total_files: files.length,
      })
      .select()
      .single()

    if (batchError || !batch) {
      console.error('[bulk-upload] Error creando batch:', batchError)
      return NextResponse.json(
        { error: 'Error al crear el lote de subida' },
        { status: 500 }
      )
    }

    // 6. Subir archivos a Storage temporal
    const uploadResults: Array<{ filename: string; path: string; success: boolean; error?: string }> = []

    for (const file of files) {
      const tempPath = `${office.id}/pending/${batch.id}/${file.name}`
      
      try {
        const arrayBuffer = await file.arrayBuffer()
        const { error: uploadError } = await service.storage
          .from('notary-documents')
          .upload(tempPath, arrayBuffer, {
            contentType: 'application/pdf',
            upsert: false,
          })

        if (uploadError) {
          console.error(`[bulk-upload] Error subiendo ${file.name}:`, uploadError)
          uploadResults.push({
            filename: file.name,
            path: tempPath,
            success: false,
            error: uploadError.message,
          })
        } else {
          uploadResults.push({
            filename: file.name,
            path: tempPath,
            success: true,
          })

          // Registrar archivo en BD
          await service.from('signing_notary_upload_files').insert({
            batch_id: batch.id,
            original_filename: file.name,
            temp_storage_path: tempPath,
            status: 'pending',
          })
        }
      } catch (error: any) {
        console.error(`[bulk-upload] Exception subiendo ${file.name}:`, error)
        uploadResults.push({
          filename: file.name,
          path: tempPath,
          success: false,
          error: error.message || 'Error desconocido',
        })
      }
    }

    const successfulUploads = uploadResults.filter((r) => r.success).length
    const failedUploads = uploadResults.filter((r) => !r.success).length

    // 7. Actualizar batch con resultados iniciales
    await service
      .from('signing_notary_upload_batches')
      .update({
        processed_files: 0,
        successful_files: 0,
        failed_files: failedUploads,
        results: uploadResults,
        status: successfulUploads > 0 ? 'pending' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    if (successfulUploads === 0) {
      return NextResponse.json(
        {
          error: 'No se pudo subir ningún archivo',
          details: uploadResults,
        },
        { status: 500 }
      )
    }

    // 8. Invocar Edge Function para procesamiento asíncrono
    try {
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-notarized-documents`
      
      // No esperamos la respuesta - fire and forget
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          batch_id: batch.id,
          notary_office_id: office.id,
        }),
      }).catch((error) => {
        console.error('[bulk-upload] Error invocando Edge Function:', error)
      })
    } catch (error) {
      console.error('[bulk-upload] Error disparando procesamiento:', error)
      // No fallar el request principal, el procesamiento se puede reintentar
    }

    // 9. Responder inmediatamente
    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      total_files: files.length,
      uploaded_successfully: successfulUploads,
      upload_failures: failedUploads,
      message: `${successfulUploads} archivo(s) subido(s). Procesando en segundo plano...`,
    })
  } catch (error: any) {
    console.error('[bulk-upload] Error general:', error)
    return NextResponse.json(
      {
        error: 'Error en la subida masiva',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notary/bulk-upload?batch_id=xxx
 * Consultar estado de un batch
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get('batch_id')

    if (!batchId) {
      return NextResponse.json({ error: 'batch_id es requerido' }, { status: 400 })
    }

    // Consultar batch con archivos
    const { data: batch, error: batchError } = await supabase
      .from('signing_notary_upload_batches')
      .select(`
        *,
        files:signing_notary_upload_files(*)
      `)
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    return NextResponse.json(batch)
  } catch (error: any) {
    console.error('[bulk-upload GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Error consultando lote',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
