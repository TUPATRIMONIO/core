import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

function extractUuidFromText(input: string) {
  const m = input.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/)
  return m ? m[0] : null
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const form = await req.formData()

    const assignmentId = (form.get('assignmentId') || '').toString()
    const documentIdInput = (form.get('documentId') || '').toString().trim()
    const file = form.get('file')

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId es requerido' }, { status: 400 })
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo PDF es requerido' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permite PDF' }, { status: 400 })
    }

    // 1) Identificar notaría del usuario
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

    // 2) Validar asignación
    const { data: assignment, error: assignmentError } = await supabase
      .from('signing_notary_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('notary_office_id', office.id)
      .maybeSingle()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Asignación no encontrada o sin acceso' }, { status: 404 })
    }

    // 3) Validar documento
    const { data: doc, error: docError } = await supabase
      .from('signing_documents')
      .select('id, organization_id, send_to_signers_on_complete')
      .eq('id', assignment.document_id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Si se entregó un ID desde QR, validarlo
    if (documentIdInput) {
      const extracted = extractUuidFromText(documentIdInput)
      if (!extracted) {
        return NextResponse.json({ error: 'documentId inválido (no se encontró UUID)' }, { status: 400 })
      }
      if (extracted !== doc.id) {
        return NextResponse.json({ error: 'El ID del QR no coincide con la asignación seleccionada' }, { status: 400 })
      }
    }

    // 4) Subir PDF a docs-notarized usando service role (para evitar exponer permisos)
    const service = createServiceRoleClient()

    // Determinar versión "current" de forma simple
    // (MVP) usamos v1; cuando implementemos re-versionado, esto se ajusta.
    const versionFolder = 'v1'
    const storagePath = `${doc.organization_id}/${doc.id}/${versionFolder}/notarized.pdf`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await service.storage
      .from('docs-notarized')
      .upload(storagePath, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Error subiendo PDF: ${uploadError.message}` }, { status: 400 })
    }

    // 5) Actualizar asignación + documento
    const now = new Date().toISOString()

    const { error: assignUpdateError } = await service
      .from('signing_notary_assignments')
      .update({
        status: 'completed',
        notarized_file_path: storagePath,
        completed_at: now,
      })
      .eq('id', assignmentId)

    if (assignUpdateError) {
      return NextResponse.json({ error: assignUpdateError.message }, { status: 400 })
    }

    const { error: docUpdateError } = await service
      .from('signing_documents')
      .update({
        status: 'notarized',
      })
      .eq('id', doc.id)
    if (doc.send_to_signers_on_complete) {
      const { error: completedError } = await service
        .from('signing_documents')
        .update({
          status: 'completed',
          completed_at: now,
        })
        .eq('id', doc.id)

      if (completedError) {
        return NextResponse.json({ error: completedError.message }, { status: 400 })
      }
    }


    if (docUpdateError) {
      return NextResponse.json({ error: docUpdateError.message }, { status: 400 })
    }

    // 6) Registrar versión (document_versions)
    // Obtenemos el mayor version_number y sumamos 1
    const { data: latestVersion } = await service
      .from('signing_document_versions')
      .select('version_number')
      .eq('document_id', doc.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersionNumber = (latestVersion?.version_number ? Number(latestVersion.version_number) : 0) + 1

    await service.from('signing_document_versions').insert({
      document_id: doc.id,
      version_number: nextVersionNumber,
      version_type: 'notarized',
      file_path: storagePath,
      file_name: 'notarized.pdf',
      file_size: arrayBuffer.byteLength,
      created_by: user.id,
    })

    return NextResponse.json({ success: true, storagePath })
  } catch (error: any) {
    console.error('[notarized-upload] error', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}


