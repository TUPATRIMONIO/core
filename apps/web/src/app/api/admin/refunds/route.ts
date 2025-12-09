import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

const REFUNDS_PER_PAGE = 20

/**
 * GET /api/admin/refunds
 * 
 * Consulta reembolsos con filtros opcionales:
 * - order_id: Filtrar por ID de orden
 * - organization_id: Filtrar por ID de organización
 * - provider_refund_id: Buscar por ID del reembolso en el proveedor
 * - status: Filtrar por estado (pending, approved, processing, completed, rejected)
 * - provider: Filtrar por proveedor (stripe, transbank_webpay, transbank_oneclick)
 * - refund_destination: Filtrar por destino (payment_method, wallet)
 * - from_date: Fecha desde (ISO string)
 * - to_date: Fecha hasta (ISO string)
 * - page: Número de página (default: 1)
 * - limit: Resultados por página (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtro
    const orderId = searchParams.get('order_id')
    const organizationId = searchParams.get('organization_id')
    const providerRefundId = searchParams.get('provider_refund_id')
    const status = searchParams.get('status')
    const provider = searchParams.get('provider')
    const refundDestination = searchParams.get('refund_destination')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    const minAmount = searchParams.get('min_amount')
    const maxAmount = searchParams.get('max_amount')
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || String(REFUNDS_PER_PAGE), 10), 100)
    const offset = (page - 1) * limit

    const supabase = createServiceRoleClient()

    // Construir query base usando la vista pública
    let query = supabase
      .from('refund_requests')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    if (providerRefundId) {
      query = query.eq('provider_refund_id', providerRefundId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (provider) {
      query = query.eq('provider', provider)
    }

    if (refundDestination) {
      query = query.eq('refund_destination', refundDestination)
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }

    if (toDate) {
      query = query.lte('created_at', toDate)
    }

    if (minAmount) {
      const minAmountNum = parseFloat(minAmount)
      if (!isNaN(minAmountNum)) {
        query = query.gte('amount', minAmountNum)
      }
    }

    if (maxAmount) {
      const maxAmountNum = parseFloat(maxAmount)
      if (!isNaN(maxAmountNum)) {
        query = query.lte('amount', maxAmountNum)
      }
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order('created_at', { ascending: false })

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data: refunds, error, count } = await query

    if (error) {
      console.error('Error consultando reembolsos:', error)
      return NextResponse.json(
        { error: `Error al consultar reembolsos: ${error.message}` },
        { status: 500 }
      )
    }

    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      refunds: refunds || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error: any) {
    console.error('Error general en la ruta de consulta de reembolsos:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

