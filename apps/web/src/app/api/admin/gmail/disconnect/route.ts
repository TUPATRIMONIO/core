import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route: Desconectar cuenta Gmail compartida
 * 
 * DELETE /api/admin/gmail/disconnect
 * 
 * Elimina los tokens OAuth de la cuenta compartida de la organización
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

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
        { error: 'Solo los platform admins pueden desconectar cuentas Gmail compartidas' },
        { status: 403 }
      )
    }

    // Obtener organización platform
    const { data: platformOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('org_type', 'platform')
      .eq('status', 'active')
      .single()

    if (!platformOrg) {
      return NextResponse.json(
        { error: 'No se encontró la organización platform' },
        { status: 404 }
      )
    }

    // Buscar cuenta compartida activa (usando la vista pública)
    const { data: account, error: fetchError } = await serviceSupabase
      .from('email_accounts')
      .select('id')
      .eq('organization_id', platformOrg.id)
      .eq('account_type', 'shared')
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError) {
      console.error('Error buscando cuenta Gmail:', fetchError)
      return NextResponse.json(
        { error: 'Error al buscar cuenta Gmail: ' + fetchError.message },
        { status: 500 }
      )
    }

    if (!account || !account.id) {
      return NextResponse.json(
        { error: 'No hay cuenta Gmail conectada' },
        { status: 404 }
      )
    }

    // Desactivar cuenta usando función RPC
    const { data: disconnected, error: disconnectError } = await serviceSupabase.rpc(
      'disconnect_email_account',
      {
        p_account_id: account.id,
      }
    )

    if (disconnectError) {
      console.error('Error desconectando cuenta Gmail:', disconnectError)
      return NextResponse.json(
        { error: 'Error al desconectar la cuenta: ' + disconnectError.message },
        { status: 500 }
      )
    }

    if (!disconnected) {
      return NextResponse.json(
        { error: 'No se pudo desconectar la cuenta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta Gmail desconectada exitosamente',
    })
  } catch (error: any) {
    console.error('Error desconectando Gmail:', error)
    return NextResponse.json(
      { error: error.message || 'Error al desconectar la cuenta' },
      { status: 500 }
    )
  }
}

