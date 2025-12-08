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

        const validStatuses = ['pending', 'approved', 'processing', 'completed', 'rejected']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Estado no válido' },
                { status: 400 }
            )
        }

        const supabase = createServiceRoleClient()

        // Obtener solicitud actual
        const { data: request, error: requestError } = await supabase
            .from('withdrawal_requests')
            .select('id, status, credits_amount, organization_id')
            .eq('id', id)
            .single()

        if (requestError || !request) {
            return NextResponse.json(
                { error: 'Solicitud no encontrada' },
                { status: 404 }
            )
        }

        // Si se marca como completado, descontar créditos
        if (status === 'completed' && request.status !== 'completed') {
            // Obtener cuenta de créditos
            const { data: account, error: accountError } = await supabase
                .from('credit_accounts')
                .select('balance')
                .eq('organization_id', request.organization_id)
                .single()

            if (accountError || !account) {
                return NextResponse.json(
                    { error: 'Cuenta de créditos no encontrada' },
                    { status: 404 }
                )
            }

            if (account.balance < request.credits_amount) {
                return NextResponse.json(
                    { error: 'Saldo insuficiente para procesar el retiro' },
                    { status: 400 }
                )
            }

            // Descontar créditos usando la función RPC
            const { error: debitError } = await supabase.rpc('spend_credits', {
                org_id_param: request.organization_id,
                amount_param: request.credits_amount,
                description_param: `Retiro de monedero - Solicitud ${id.substring(0, 8)}`,
            })

            if (debitError) {
                console.error('Error descontando créditos:', debitError)
                return NextResponse.json(
                    { error: 'Error al descontar créditos' },
                    { status: 500 }
                )
            }
        }

        // Actualizar estado
        const updateData: any = { status }
        if (status === 'completed' || status === 'rejected') {
            updateData.processed_at = new Date().toISOString()
        }

        const { data: updatedRequest, error: updateError } = await supabase
            .from('withdrawal_requests')
            .update(updateData)
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
            request: updatedRequest,
        })
    } catch (error: any) {
        console.error('Error en PATCH /api/admin/billing/withdrawals/[id]/status:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

