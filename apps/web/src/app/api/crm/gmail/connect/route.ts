import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/gmail/client'
import { getActiveOrganizationId } from '@/lib/organization/get-active-org'

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

    // Obtener organización del usuario
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);
    
    if (orgError || !organizationId) {
        return NextResponse.json(
            { error: orgError || "Usuario no pertenece a ninguna organización activa" },
            { status: 403 }
        );
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



