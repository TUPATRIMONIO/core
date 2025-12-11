import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Obtener organización
    const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
    
    if (!orgUser) {
        return NextResponse.json(
            { error: "Usuario no pertenece a ninguna organización activa" },
            { status: 403 }
        );
    }
    const organizationId = orgUser.organization_id;

    // Obtener cuenta compartida activa
    const { data: account } = await serviceSupabase
      .from('email_accounts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('account_type', 'shared')
      .eq('is_active', true)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'No hay cuenta conectada' },
        { status: 404 }
      )
    }

    // Desconectar (marcar como inactiva)
    const { error: updateError } = await serviceSupabase
      .from('email_accounts')
      .update({
        is_active: false,
        disconnected_at: new Date().toISOString(),
        disconnected_by: user.id,
      })
      .eq('id', account.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error desconectando Gmail:', error)
    return NextResponse.json(
      { error: error.message || 'Error al desconectar Gmail' },
      { status: 500 }
    )
  }
}
