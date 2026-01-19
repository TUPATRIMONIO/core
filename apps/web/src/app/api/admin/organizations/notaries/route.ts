import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const serviceSupabase = createServiceRoleClient()
    let query = serviceSupabase
      .from('signing_notary_offices')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('approval_status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error listando notarías:', error)
      return NextResponse.json({ error: 'Error al obtener notarías' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error en GET /api/admin/organizations/notaries:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
