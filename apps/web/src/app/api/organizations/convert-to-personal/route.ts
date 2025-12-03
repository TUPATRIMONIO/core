import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/organizations/convert-to-personal
 * Convierte la organización empresarial del usuario autenticado a personal (B2B → B2C)
 * Solo funciona si el usuario es owner de una organización empresarial
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener la organización activa del usuario y verificar que sea owner
    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select(`
        organization_id,
        role:roles(slug, level)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (orgUserError || !orgUser) {
      return NextResponse.json(
        { error: 'No se encontró tu organización' },
        { status: 404 }
      )
    }

    // Verificar que el usuario sea owner (rol org_owner)
    const roleSlug = (orgUser.role as any)?.slug
    if (roleSlug !== 'org_owner') {
      return NextResponse.json(
        { error: 'Solo el dueño de la organización puede realizar esta conversión' },
        { status: 403 }
      )
    }

    // Verificar que la organización sea de tipo business
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, org_type')
      .eq('id', orgUser.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Error al obtener información de la organización' },
        { status: 500 }
      )
    }

    if (org.org_type !== 'business') {
      return NextResponse.json(
        { 
          error: `Tu organización ya es de tipo ${org.org_type === 'personal' ? 'personal (B2C)' : org.org_type}. No se puede convertir.`,
          current_type: org.org_type
        },
        { status: 400 }
      )
    }

    // Obtener información para advertencias
    const warnings: string[] = []

    // Contar usuarios activos en la organización
    const { count: activeUsersCount } = await supabase
      .from('organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgUser.organization_id)
      .eq('status', 'active')

    if (activeUsersCount && activeUsersCount > 1) {
      warnings.push(`Tienes ${activeUsersCount} usuarios activos. Después de la conversión, el límite será de 1 usuario. Los usuarios adicionales mantendrán acceso hasta que los remuevas manualmente.`)
    }

    // Contar contactos en el CRM
    try {
      const { count: contactsCount } = await supabase
        .schema('crm')
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgUser.organization_id)

      if (contactsCount && contactsCount > 100) {
        warnings.push(`Tienes ${contactsCount} contactos. Después de la conversión, el límite será de 100 contactos. Los contactos existentes se mantendrán pero no podrás agregar más hasta estar bajo el límite.`)
      }
    } catch (error) {
      // Si no existe la tabla o hay error, ignorar
    }

    // Llamar a la función SQL para convertir la organización
    const { data: result, error: convertError } = await supabase.rpc(
      'convert_organization_b2b_to_b2c',
      {
        p_organization_id: orgUser.organization_id
      }
    )

    if (convertError) {
      console.error('Error convirtiendo organización:', convertError)
      
      // Traducir errores comunes
      let errorMessage = 'Error al convertir la organización'
      if (convertError.message.includes('ya es de tipo')) {
        errorMessage = convertError.message
      } else if (convertError.message.includes('no encontrada')) {
        errorMessage = 'Organización no encontrada'
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tu organización ha sido convertida exitosamente a personal (B2C)',
      warnings: warnings.length > 0 ? warnings : undefined,
      data: result
    })
  } catch (error: any) {
    console.error('Error en /api/organizations/convert-to-personal:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

