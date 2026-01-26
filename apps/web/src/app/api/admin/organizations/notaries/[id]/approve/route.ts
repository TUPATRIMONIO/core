import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  _request: Request,
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

    const { id } = await params
    const serviceSupabase = createServiceRoleClient()

    const { data, error } = await serviceSupabase
      .from('signing_notary_offices')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        rejection_reason: null,
        accepts_new_documents: true,
        is_active: true,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error aprobando notaría:', error)
      return NextResponse.json({ error: 'No se pudo aprobar la notaría' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en approve notary:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

