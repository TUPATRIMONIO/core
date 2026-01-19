import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_platform_admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return NextResponse.json(
        { error: 'El motivo de rechazo es requerido' },
        { status: 400 }
      )
    }

    const { id } = await params
    const serviceSupabase = createServiceRoleClient()

    const { data, error } = await serviceSupabase
      .from('signing_notary_offices')
      .update({
        approval_status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        rejection_reason: reason.trim(),
        accepts_new_documents: false,
        is_active: false,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error rechazando notaría:', error)
      return NextResponse.json({ error: 'No se pudo rechazar la notaría' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en reject notary:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
