import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/applications/[id]/overrides
 * Obtener todos los overrides de una aplicación
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta ruta' },
        { status: 403 }
      )
    }

    // Obtener overrides con información de organización
    const { data: overrides, error } = await supabase
      .from('application_overrides')
      .select(`
        *,
        organizations(id, name, slug, country, is_beta_tester)
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching overrides:', error)
      return NextResponse.json(
        { error: 'Error al obtener overrides' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: overrides || [] })
  } catch (error: any) {
    console.error('Error en GET /api/admin/applications/[id]/overrides:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/applications/[id]/overrides
 * Crear o actualizar un override para una organización
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear overrides' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { organization_id, is_enabled, expires_at } = body

    // Validaciones
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id es requerido' },
        { status: 400 }
      )
    }

    // Crear o actualizar override (upsert)
    const { data: override, error } = await supabase
      .from('application_overrides')
      .upsert({
        application_id: id,
        organization_id,
        is_enabled: is_enabled ?? true,
        expires_at: expires_at || null
      }, {
        onConflict: 'application_id,organization_id'
      })
      .select(`
        *,
        organizations(id, name, slug, country)
      `)
      .single()

    if (error) {
      console.error('Error creating override:', error)
      return NextResponse.json(
        { error: 'Error al crear override' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: override }, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/admin/applications/[id]/overrides:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

