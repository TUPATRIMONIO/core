import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar permisos
    const { data: orgUsers } = await supabase
      .from('organization_users')
      .select(`
        role:roles(slug, level)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    const hasAccess = orgUsers?.some((ou: any) =>
      ou.role?.slug === 'document_reviewer' || ou.role?.level >= 9
    )

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { assignmentId, adminNotes, attachments } = await request.json()

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const adminSupabase = createServiceRoleClient()

    // 1. Obtener el assignment actual para saber el document_id
    const { data: assignment, error: fetchError } = await adminSupabase
      .from('signing_notary_assignments')
      .select('document_id')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // 2. Insertar adjuntos si existen (en tabla legacy y nueva nota)
    // Mantenemos la tabla legacy por compatibilidad si se usó, pero lo ideal es usar solo notas.
    // Para este plan, vamos a insertar una NOTA en signing.notary_assignment_notes
    // que contenga el mensaje y los adjuntos.

    // Construir objeto de adjuntos para la nota
    const noteAttachments = attachments && Array.isArray(attachments) 
      ? attachments.map((att: any) => ({
          path: att.path,
          name: att.name,
          size: att.size,
          type: att.type
        }))
      : []

    // Insertar nota de historial
    const { error: noteError } = await adminSupabase
      .from('signing_notary_assignment_notes')
      .insert({
        assignment_id: assignmentId,
        sender_type: 'admin',
        sender_id: user.id,
        message: adminNotes || 'Observación resuelta',
        action_type: 'resolved',
        attachments: noteAttachments
      })

    if (noteError) {
      console.error('Error inserting history note:', noteError)
      // No bloqueante, pero grave
    }

    // 3. Actualizar assignment: status -> pending, limpiar razones, guardar notas (legacy)
    const { error: updateAssignmentError } = await adminSupabase
      .from('signing_notary_assignments')
      .update({
        status: 'pending',
        correction_request: null,
        rejection_reason: null,
        admin_notes: adminNotes || null, // Mantenemos legacy por si acaso
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)

    if (updateAssignmentError) {
      console.error('Error updating assignment:', updateAssignmentError)
      return NextResponse.json({ error: 'Error updating assignment' }, { status: 500 })
    }

    // 4. Actualizar documento: status -> pending_notary
    const { error: updateDocError } = await adminSupabase
      .from('signing_documents')
      .update({
        status: 'pending_notary',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.document_id)

    if (updateDocError) {
      console.error('Error updating document:', updateDocError)
      // Intentar revertir assignment (opcional, pero buena práctica)
      return NextResponse.json({ error: 'Error updating document status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error resolving notary observation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
