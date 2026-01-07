import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createClient } from '@/lib/supabase/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * POST /api/admin/orders/[id]/restart
 * Permite a un administrador reiniciar el proceso de firma de un pedido.
 * Puede elegir si cobrar o no las firmas realizadas.
 */
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { chargeSignatures, adminNotes } = body

        if (chargeSignatures === undefined) {
            return NextResponse.json(
                { error: 'chargeSignatures es requerido' },
                { status: 400 }
            )
        }

        // Obtener el usuario autenticado actual
        const authClient = await createClient()
        const { data: { user: adminUser } } = await authClient.auth.getUser()
        
        // Usar service role para las operaciones
        const supabase = createServiceRoleClient()

        // Llamar a la función RPC restart_order
        const { data, error: rpcError } = await supabase.rpc('restart_order', {
            p_order_id: id,
            p_charge_signatures: chargeSignatures,
            p_admin_notes: adminNotes,
            p_performed_by: adminUser?.id || null
        })

        if (rpcError) {
            console.error('Error en RPC admin restart_order:', rpcError)
            return NextResponse.json({ error: 'Error al reiniciar el pedido: ' + rpcError.message }, { status: 500 })
        }

        if (!data.success) {
            return NextResponse.json({ error: data.error }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            chargedAmount: data.chargedAmount,
            pendingAmount: data.pendingAmount,
            message: 'Pedido reiniciado exitosamente por el administrador'
        })

    } catch (error: any) {
        console.error('Error en POST /api/admin/orders/[id]/restart:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

