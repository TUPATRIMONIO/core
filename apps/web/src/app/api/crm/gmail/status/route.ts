import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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
      .select('id, email_address, is_active, connected_at')
      .eq('organization_id', organizationId)
      .eq('account_type', 'shared')
      .eq('is_active', true)
      .maybeSingle()

    return NextResponse.json({
      connected: !!account,
      account: account || null,
    })
  } catch (error: any) {
    console.error('Error obteniendo estado Gmail:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estado' },
      { status: 500 }
    )
  }
}
