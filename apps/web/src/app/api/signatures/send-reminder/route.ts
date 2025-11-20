import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, signerId } = body

    if (!documentId || !signerId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Get document and verify access
    const { data: document, error: docError } = await supabase
      .schema('signatures')
      .from('documents')
      .select('organization_id, title')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Verify organization membership
    const { data: membership } = await supabase
      .schema('core')
      .from('organization_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', document.organization_id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes acceso a este documento' },
        { status: 403 }
      )
    }

    // Get signer
    const { data: signer, error: signerError } = await supabase
      .schema('signatures')
      .from('document_signers')
      .select('*')
      .eq('id', signerId)
      .eq('document_id', documentId)
      .single()

    if (signerError || !signer) {
      return NextResponse.json({ error: 'Firmante no encontrado' }, { status: 404 })
    }

    // Create event
    await supabase
      .schema('signatures')
      .from('document_events')
      .insert({
        document_id: documentId,
        organization_id: document.organization_id,
        signer_id: signerId,
        event_type: 'signer_reminder_sent',
        description: `Recordatorio enviado a ${signer.name}`,
        performed_by: user.id,
      })

    // Update signer status if still pending
    if (signer.status === 'pending') {
      await supabase
        .schema('signatures')
        .from('document_signers')
        .update({ status: 'notified' })
        .eq('id', signerId)
    }

    // TODO: Send actual email notification via SendGrid or similar
    // For now, we just log the event

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

