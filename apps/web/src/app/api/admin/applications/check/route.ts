import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/applications/check
 * Verificar si un usuario/organización puede acceder a una aplicación
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { application_slug, organization_id } = body

    if (!application_slug) {
      return NextResponse.json(
        { error: 'application_slug es requerido' },
        { status: 400 }
      )
    }

    // Obtener organización del usuario si no se proporciona
    let finalOrgId = organization_id
    if (!finalOrgId) {
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1)
        .single()

      if (orgUser) {
        finalOrgId = orgUser.organization_id
      }
    }

    // Verificar acceso usando la función SQL
    const { data: hasAccess, error } = await supabase.rpc('can_access_application', {
      p_application_slug: application_slug,
      p_organization_id: finalOrgId || null,
      p_user_id: user.id
    })

    if (error) {
      console.error('Error checking application access:', error)
      return NextResponse.json(
        { error: 'Error al verificar acceso' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasAccess: hasAccess || false,
      application_slug,
      organization_id: finalOrgId
    })
  } catch (error: any) {
    console.error('Error en POST /api/admin/applications/check:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}





