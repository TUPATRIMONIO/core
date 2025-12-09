import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route: Debug - Verificar estado de cuentas Gmail
 * 
 * GET /api/admin/gmail/debug?organizationId=xxx
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

    // Buscar todas las cuentas de esta organización
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error,
      }, { status: 500 })
    }

    // Buscar específicamente cuentas compartidas activas
    const { data: sharedAccounts } = await supabase
      .from('email_accounts')
      .select('id, email_address, account_type, is_active, connected_at')
      .eq('organization_id', organizationId)
      .eq('account_type', 'shared')
      .eq('is_active', true)

    return NextResponse.json({
      organizationId,
      totalAccounts: accounts?.length || 0,
      allAccounts: accounts || [],
      sharedActiveAccounts: sharedAccounts || [],
      hasActiveSharedAccount: (sharedAccounts?.length || 0) > 0,
    })
  } catch (error: any) {
    console.error('Error en debug Gmail:', error)
    return NextResponse.json(
      { error: error.message || 'Error desconocido', stack: error.stack },
      { status: 500 }
    )
  }
}

