import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Usamos service role para evitar problemas de RLS entre tablas de distintos esquemas
    const adminSupabase = createServiceRoleClient()

    // 1. Consultar notas de la tabla nueva
    const { data: notes, error } = await adminSupabase
      .from('signing_notary_assignment_notes')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[assignment-notes] Error fetching notes:', error)
    }

    // 2. Consultar datos legacy del assignment
    const { data: assignment, error: assignmentError } = await adminSupabase
      .from('signing_notary_assignments')
      .select('admin_notes, correction_request, rejection_reason, updated_at')
      .eq('id', assignmentId)
      .maybeSingle()

    if (assignmentError) {
      console.error('[assignment-notes] Error fetching assignment:', assignmentError)
    }

    // 3. Consultar adjuntos legacy
    let legacyAttachments: any[] = []
    const { data: attachmentsData, error: attachmentsError } = await adminSupabase
      .from('signing_notary_assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)

    if (attachmentsError) {
      console.error('[assignment-notes] Error fetching legacy attachments:', attachmentsError)
    } else if (attachmentsData) {
      legacyAttachments = attachmentsData
    }

    const combinedNotes = [...(notes || [])]

    // 4. Construir notas legacy si no están duplicadas
    if (assignment || legacyAttachments.length > 0) {
      let adminNoteExists = false

      // Nota de admin legacy (admin_notes en la tabla de assignments)
      if (assignment?.admin_notes) {
        const isDuplicated = (notes || []).some(n => 
          n.sender_type === 'admin' && n.message === assignment.admin_notes
        )

        if (!isDuplicated) {
          const attachmentsForNote = legacyAttachments.map(att => ({
            path: att.file_path,
            name: att.file_name,
            size: att.file_size,
            type: att.mime_type
          }))

          combinedNotes.push({
            id: 'legacy-admin-note',
            assignment_id: assignmentId,
            sender_type: 'admin',
            sender_id: null,
            message: assignment.admin_notes,
            action_type: 'resolved',
            attachments: attachmentsForNote,
            created_at: assignment.updated_at || new Date().toISOString()
          })
          adminNoteExists = true
        }
      }

      // Si hay adjuntos legacy huérfanos (sin nota de admin)
      if (!adminNoteExists && legacyAttachments.length > 0) {
        // Verificar que estos adjuntos no están ya en alguna nota nueva
        const allNewAttachmentPaths = new Set<string>()
        for (const n of (notes || [])) {
          const atts = Array.isArray(n.attachments) ? n.attachments : []
          for (const a of atts) {
            if (a.path) allNewAttachmentPaths.add(a.path)
          }
        }

        const orphanAttachments = legacyAttachments
          .filter(att => !allNewAttachmentPaths.has(att.file_path))
          .map(att => ({
            path: att.file_path,
            name: att.file_name,
            size: att.file_size,
            type: att.mime_type
          }))

        if (orphanAttachments.length > 0) {
          combinedNotes.push({
            id: 'legacy-attachments-note',
            assignment_id: assignmentId,
            sender_type: 'admin',
            sender_id: null,
            message: 'Documentos adjuntos enviados',
            action_type: 'resolved',
            attachments: orphanAttachments,
            created_at: legacyAttachments[0]?.created_at || assignment?.updated_at || new Date().toISOString()
          })
        }
      }

      // Nota de corrección legacy
      if (assignment?.correction_request) {
        const isDuplicated = (notes || []).some(n => 
          n.sender_type === 'notary' && n.message === assignment.correction_request
        )

        if (!isDuplicated) {
          combinedNotes.push({
            id: 'legacy-correction-note',
            assignment_id: assignmentId,
            sender_type: 'notary',
            sender_id: null,
            message: assignment.correction_request,
            action_type: 'needs_correction',
            attachments: [],
            created_at: assignment.updated_at || new Date().toISOString()
          })
        }
      }

      // Nota de rechazo legacy
      if (assignment?.rejection_reason) {
        const isDuplicated = (notes || []).some(n => 
          n.sender_type === 'notary' && n.message === assignment.rejection_reason
        )

        if (!isDuplicated) {
          combinedNotes.push({
            id: 'legacy-rejection-note',
            assignment_id: assignmentId,
            sender_type: 'notary',
            sender_id: null,
            message: assignment.rejection_reason,
            action_type: 'rejected',
            attachments: [],
            created_at: assignment.updated_at || new Date().toISOString()
          })
        }
      }
    }

    // 5. También verificar si alguna nota nueva tiene adjuntos como JSONB guardado incorrectamente
    // (por si se guardó como string en vez de array)
    for (const note of combinedNotes) {
      if (typeof note.attachments === 'string') {
        try {
          note.attachments = JSON.parse(note.attachments)
        } catch {
          note.attachments = []
        }
      }
      if (!Array.isArray(note.attachments)) {
        note.attachments = []
      }
    }

    // 6. Ordenar por fecha
    combinedNotes.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // 7. Generar URLs firmadas para adjuntos
    const enrichedNotes = await Promise.all(combinedNotes.map(async (note) => {
      if (!note.attachments || note.attachments.length === 0) {
        return note
      }

      const attachmentsWithUrls = await Promise.all(note.attachments.map(async (att: any) => {
        if (att.signedUrl) return att

        const bucket = 'notary-attachments'
        const path = att.path

        if (!path) return att

        const { data, error: signError } = await adminSupabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600)

        if (signError) {
          console.error('[assignment-notes] Error signing URL:', path, signError)
        }

        return {
          ...att,
          signedUrl: data?.signedUrl || null
        }
      }))

      return {
        ...note,
        attachments: attachmentsWithUrls
      }
    }))

    return NextResponse.json(enrichedNotes)
  } catch (error: any) {
    console.error('[assignment-notes] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
