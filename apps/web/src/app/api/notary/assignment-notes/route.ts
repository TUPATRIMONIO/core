import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // 1. Consultar notas de la tabla nueva
    const { data: notes, error } = await supabase
      .from('signing_notary_assignment_notes')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Error fetching notes' }, { status: 500 })
    }

    // 2. Consultar datos legacy para construir historial completo
    const { data: assignment } = await supabase
      .from('signing_notary_assignments')
      .select('admin_notes, correction_request, rejection_reason, updated_at')
      .eq('id', assignmentId)
      .maybeSingle()

    // Consultar adjuntos legacy (si la tabla existe)
    let legacyAttachments: any[] = []
    try {
      const { data: attachments } = await supabase
        .from('signing_notary_assignment_attachments')
        .select('*')
        .eq('assignment_id', assignmentId)
      
      if (attachments) legacyAttachments = attachments
    } catch (e) {
      // Ignorar error si la tabla no existe
    }

    const combinedNotes = [...(notes || [])]

    // Agregar notas legacy si no están duplicadas
    if (assignment || legacyAttachments.length > 0) {
      // Nota de admin legacy
      let adminNoteExists = false
      if (assignment?.admin_notes) {
        const isDuplicated = notes?.some(n => 
          n.sender_type === 'admin' && n.message === assignment.admin_notes
        )

        if (!isDuplicated) {
          // Asociar adjuntos legacy a esta nota
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

      // Si hay adjuntos legacy pero NO se creó una nota de admin (porque no había texto),
      // creamos una nota de "Adjuntos enviados" para mostrarlos.
      if (!adminNoteExists && legacyAttachments.length > 0) {
        // Verificar si estos adjuntos ya están en alguna nota nueva (poco probable si son legacy)
        // Asumimos que si no hay nota de admin legacy, estos adjuntos están huérfanos de visualización
        const attachmentsForNote = legacyAttachments.map(att => ({
          path: att.file_path,
          name: att.file_name,
          size: att.file_size,
          type: att.mime_type
        }))

        combinedNotes.push({
          id: 'legacy-attachments-note',
          assignment_id: assignmentId,
          sender_type: 'admin',
          sender_id: null,
          message: 'Documentos adjuntos enviados',
          action_type: 'resolved',
          attachments: attachmentsForNote,
          created_at: assignment?.updated_at || new Date().toISOString()
        })
      }

      // Nota de corrección legacy
      if (assignment?.correction_request) {
        const isDuplicated = notes?.some(n => 
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
        const isDuplicated = notes?.some(n => 
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

    // Ordenar combinado por fecha
    combinedNotes.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // Enriquecer con URLs firmadas
    const enrichedNotes = await Promise.all(combinedNotes.map(async (note) => {
      if (!note.attachments || !Array.isArray(note.attachments) || note.attachments.length === 0) {
        return note
      }

      const attachmentsWithUrls = await Promise.all(note.attachments.map(async (att: any) => {
        if (att.signedUrl) return att

        const bucket = 'docs' 
        const path = att.path

        const { data } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600) // 1 hora

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
    console.error('Error in assignment-notes API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
