import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/onboarding/business
 * Crea una organización empresarial (B2B) para el usuario autenticado
 * Body: { name: string, industry?: string, size?: string }
 */
export async function POST(request: Request) {
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

    // Parsear body
    const body = await request.json()
    const { name, industry, size } = body

    // Validar campos requeridos
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      )
    }

    // Validar longitud del nombre
    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'El nombre de la empresa no puede exceder 100 caracteres' },
        { status: 400 }
      )
    }

    // Crear organización empresarial usando función RPC
    const { data: orgId, error: createError } = await supabase.rpc(
      'create_business_organization',
      {
        user_id: user.id,
        user_email: user.email || '',
        org_name: name.trim(),
        org_industry: industry?.trim() || null,
        org_size: size?.trim() || null,
      }
    )

    if (createError) {
      console.error('Error creando organización empresarial:', createError)

      // Traducir errores comunes
      let errorMessage = 'Error al crear organización empresarial'
      if (createError.message.includes('duplicate key')) {
        errorMessage = 'Ya existe una organización con ese nombre'
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
      type: 'business',
      name: name.trim(),
    })
  } catch (error) {
    console.error('Error en /api/onboarding/business:', error)

    // Manejar errores de parsing JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de datos inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


