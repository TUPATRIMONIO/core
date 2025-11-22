import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/onboarding/personal
 * Crea una organización personal (B2C) para el usuario autenticado
 */
export async function POST() {
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

    // Verificar si ya tiene organización
    const { data: hasOrg, error: checkError } = await supabase.rpc(
      'user_has_organization',
      {
        user_id: user.id,
      }
    )

    if (checkError) {
      console.error('Error verificando organización:', checkError)
      return NextResponse.json(
        { error: 'Error al verificar estado' },
        { status: 500 }
      )
    }

    if (hasOrg === true) {
      return NextResponse.json(
        { error: 'Ya tienes una organización asociada' },
        { status: 400 }
      )
    }

    // Extraer first_name del email si no está disponible
    const emailParts = user.email?.split('@')[0] || ''
    const firstName = emailParts.split('.')[0] || emailParts || null

    // Crear organización personal usando función RPC
    const { data: orgId, error: createError } = await supabase.rpc(
      'create_personal_organization',
      {
        user_id: user.id,
        user_email: user.email || '',
        user_first_name: firstName,
      }
    )

    if (createError) {
      console.error('Error creando organización personal:', createError)

      // Traducir errores comunes
      let errorMessage = 'Error al crear organización personal'
      if (createError.message.includes('already has a personal organization')) {
        errorMessage = 'Ya tienes una organización personal asociada'
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'No se pudo crear la organización' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization_id: orgId,
      type: 'personal',
    })
  } catch (error) {
    console.error('Error en /api/onboarding/personal:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

