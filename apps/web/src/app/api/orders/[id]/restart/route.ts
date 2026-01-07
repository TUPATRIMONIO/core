import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * POST /api/orders/[id]/restart
 * Permite a un usuario reiniciar el proceso de firma de un pedido.
 * El usuario debe pertenecer a la organización del pedido.
 */
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { confirmCharge } = body

        if (confirmCharge === undefined) {
            return NextResponse.json(
                { error: 'confirmCharge es requerido' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // 1. Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // 2. Obtener la orden y verificar pertenencia a la organización
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, organization_id, amount, status')
            .eq('id', id)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
        }

        // Verificar membresía activa en la organización
        const { data: membership } = await supabase
            .from('organization_users')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', order.organization_id)
            .eq('status', 'active')
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No tienes permiso para acceder a esta orden' }, { status: 403 })
        }

        // 3. Validar estado del proceso de firma
        // Solo permitir si está pagado o completado (ya tiene proceso iniciado)
        if (order.status !== 'paid' && order.status !== 'completed') {
            return NextResponse.json({ error: 'Solo se pueden reiniciar pedidos pagados o completados' }, { status: 400 })
        }

        // 4. Llamar a la función RPC restart_order
        // Usamos confirmCharge como p_charge_signatures
        const { data, error: rpcError } = await supabase.rpc('restart_order', {
            p_order_id: id,
            p_charge_signatures: confirmCharge,
            p_performed_by: user.id
        })

        if (rpcError) {
            console.error('Error en RPC restart_order:', rpcError)
            return NextResponse.json({ error: 'Error al reiniciar el pedido: ' + rpcError.message }, { status: 500 })
        }

        if (!data.success) {
            return NextResponse.json({ error: data.error }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            chargedAmount: data.chargedAmount,
            pendingAmount: data.pendingAmount,
            message: 'Pedido reiniciado exitosamente'
        })

    } catch (error: any) {
        console.error('Error en POST /api/orders/[id]/restart:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

