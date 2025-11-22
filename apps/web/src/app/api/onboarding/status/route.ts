import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/onboarding/status
 * Verifica si el usuario completó el onboarding (tiene organización)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar si tiene organización usando función RPC
    const { data, error } = await supabase.rpc('user_has_organization', {
      user_id: user.id,
    })

    if (error) {
      console.error('Error verificando organización:', error)
      return NextResponse.json(
        { error: 'Error al verificar estado de onboarding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      has_organization: data === true,
    })
  } catch (error) {
    console.error('Error en /api/onboarding/status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

