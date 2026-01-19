import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
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

    const { data: services, error } = await serviceSupabase
      .schema('signing')
      .from('notary_services')
      .select('*')
      .eq('notary_office_id', id)

    if (error) {
      console.error('Error obteniendo servicios de notaría:', error)
      return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: services || [] })
  } catch (error) {
    console.error('Error en GET notary services:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
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
    const { services } = body

    if (!Array.isArray(services)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    const { id } = await params
    const serviceSupabase = createServiceRoleClient()

    const payload = services.map((service) => ({
      notary_office_id: id,
      product_id: service.product_id,
      is_active: Boolean(service.is_active),
      weight: Math.max(1, Number(service.weight) || 1),
      max_daily_documents:
        service.max_daily_documents === null || service.max_daily_documents === ''
          ? null
          : Number(service.max_daily_documents),
    }))

    const { data, error } = await serviceSupabase
      .schema('signing')
      .from('notary_services')
      .upsert(payload, { onConflict: 'notary_office_id,product_id' })
      .select()

    if (error) {
      console.error('Error actualizando servicios de notaría:', error)
      return NextResponse.json({ error: 'No se pudieron guardar los cambios' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en PUT notary services:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
