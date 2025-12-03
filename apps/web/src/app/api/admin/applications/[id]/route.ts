import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/applications/[id]
 * Obtener una aplicación específica con sus overrides
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

    // Obtener aplicación con overrides
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        application_overrides(
          id,
          organization_id,
          is_enabled,
          expires_at,
          organizations(id, name, slug, country, is_beta_tester)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Aplicación no encontrada' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching application:', error)
      return NextResponse.json(
        { error: 'Error al obtener aplicación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: application })
  } catch (error: any) {
    console.error('Error en GET /api/admin/applications/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/applications/[id]
 * Actualizar una aplicación
 */
export async function PATCH(
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
        { error: 'No tienes permiso para actualizar aplicaciones' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const updateData: any = {}

    // Solo incluir campos que se envían
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.is_beta !== undefined) updateData.is_beta = body.is_beta
    if (body.visibility_level !== undefined) updateData.visibility_level = body.visibility_level
    if (body.allowed_countries !== undefined) updateData.allowed_countries = body.allowed_countries
    if (body.required_subscription_tiers !== undefined) updateData.required_subscription_tiers = body.required_subscription_tiers

    // Actualizar aplicación usando función RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_application', {
      p_id: id,
      p_is_active: updateData.is_active,
      p_is_beta: updateData.is_beta,
      p_visibility_level: updateData.visibility_level,
      p_allowed_countries: updateData.allowed_countries,
      p_required_subscription_tiers: updateData.required_subscription_tiers,
    })

    if (rpcError) {
      console.error('Error calling update_application RPC:', rpcError)
      return NextResponse.json(
        { error: `Error al actualizar aplicación: ${rpcError.message}` },
        { status: 500 }
      )
    }

    // La función RPC devuelve { success: boolean, data/error: ... }
    if (!rpcResult?.success) {
      return NextResponse.json(
        { error: rpcResult?.error || 'Error al actualizar aplicación' },
        { status: rpcResult?.error?.includes('no encontrada') ? 404 : 500 }
      )
    }

    return NextResponse.json({ data: rpcResult.data })
  } catch (error: any) {
    console.error('Error en PATCH /api/admin/applications/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

