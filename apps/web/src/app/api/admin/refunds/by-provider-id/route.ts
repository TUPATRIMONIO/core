import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/refunds/by-provider-id?provider_refund_id=xxx&provider=stripe
 * 
 * Busca un reembolso por su ID en el proveedor (Stripe/Transbank)
 * Útil cuando solo tenemos el ID del proveedor (ej: desde el portal de Transbank)
 * 
 * Parámetros:
 * - provider_refund_id: ID del reembolso en el proveedor (requerido)
 * - provider: Proveedor (stripe, transbank_webpay, transbank_oneclick) - opcional pero recomendado
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerRefundId = searchParams.get('provider_refund_id')
    const provider = searchParams.get('provider')

    if (!providerRefundId) {
      return NextResponse.json(
        { error: 'provider_refund_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Construir query
    let query = supabase
      .from('refund_requests')
      .select('*')
      .eq('provider_refund_id', providerRefundId)

    // Si se especifica el proveedor, filtrar por él también
    if (provider) {
      query = query.eq('provider', provider)
    }

    const { data: refunds, error } = await query

    if (error) {
      console.error('Error buscando reembolso por provider_refund_id:', error)
      return NextResponse.json(
        { error: `Error al buscar reembolso: ${error.message}` },
        { status: 500 }
      )
    }

    if (!refunds || refunds.length === 0) {
      return NextResponse.json(
        { error: 'Reembolso no encontrado' },
        { status: 404 }
      )
    }

    // Si hay múltiples resultados (no debería pasar, pero por si acaso)
    if (refunds.length > 1) {
      console.warn(`Se encontraron ${refunds.length} reembolsos con el mismo provider_refund_id:`, providerRefundId)
    }

    return NextResponse.json({
      refund: refunds[0],
      count: refunds.length,
    })
  } catch (error: any) {
    console.error('Error general en la búsqueda por provider_refund_id:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

