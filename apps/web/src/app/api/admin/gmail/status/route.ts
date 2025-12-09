import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route: Verificar estado de cuenta Gmail compartida
 * 
 * GET /api/admin/gmail/status?organizationId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Buscar cuenta compartida activa
    const { data: account } = await supabase
      .from('email_accounts')
      .select('id, email_address, is_active')
      .eq('organization_id', organizationId)
      .eq('account_type', 'shared')
      .eq('is_active', true)
      .single()

    return NextResponse.json({
      connected: !!account,
      email: account?.email_address || null,
    })
  } catch (error: any) {
    console.error('Error verificando estado Gmail:', error)
    return NextResponse.json(
      { error: error.message || 'Error al verificar estado' },
      { status: 500 }
    )
  }
}

