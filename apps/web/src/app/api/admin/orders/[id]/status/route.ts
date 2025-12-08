import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status } = body

        if (!status) {
            return NextResponse.json(
                { error: 'status es requerido' },
                { status: 400 }
            )
        }

        const supabase = createServiceRoleClient()

        // Verificar que el estado es válido
        const { data: validStatuses } = await supabase
            .from('order_pipeline_stages')
            .select('slug')
            .eq('slug', status)
            .single()

        if (!validStatuses) {
            return NextResponse.json(
                { error: 'Estado no válido' },
                { status: 400 }
            )
        }

        // Obtener orden actual
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, status, organization_id')
            .eq('id', id)
            .single()

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Orden no encontrada' },
                { status: 404 }
            )
        }

        // Actualizar estado
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error actualizando estado:', updateError)
            return NextResponse.json(
                { error: 'Error al actualizar el estado' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            order: updatedOrder,
        })
    } catch (error: any) {
        console.error('Error en PATCH /api/admin/orders/[id]/status:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

