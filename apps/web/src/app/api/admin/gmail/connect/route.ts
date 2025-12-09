import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/gmail/client'

/**
 * API Route: Iniciar conexión OAuth con Gmail
 * 
 * GET /api/admin/gmail/connect
 * 
 * Genera URL de autorización OAuth2 y redirige a Google
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
        { error: 'Solo los platform admins pueden conectar cuentas Gmail compartidas' },
        { status: 403 }
      )
    }

    // Obtener organización del usuario (o platform org)
    let organizationId: string | null = null

    // Si es platform admin, obtener la organización platform
    const { data: platformOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('org_type', 'platform')
      .eq('status', 'active')
      .single()

    if (platformOrg) {
      organizationId = platformOrg.id
    } else {
      // Fallback: obtener cualquier organización del usuario
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single()

      if (orgUser) {
        organizationId = orgUser.organization_id
      }
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'No se pudo encontrar una organización' },
        { status: 400 }
      )
    }

    // Generar URL de autorización con state que incluye organization_id
    const state = Buffer.from(JSON.stringify({ organizationId, userId: user.id })).toString('base64')
    const authUrl = getAuthUrl(state)

    // Redirigir a Google
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error iniciando conexión Gmail:', error)
    return NextResponse.json(
      { error: error.message || 'Error al iniciar conexión con Gmail' },
      { status: 500 }
    )
  }
}

