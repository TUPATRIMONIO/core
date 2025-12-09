import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createStripeRefund } from '@/lib/stripe/refunds'
import { createTransbankWebpayRefund, createTransbankOneclickRefund } from '@/lib/transbank/refunds'
import { refundToCredits } from '@/lib/credits/refunds'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id: orderId } = await params
        const body = await request.json()
        const { 
            amount, 
            currency, 
            refund_destination, 
            reason,
            notes 
        } = body

        console.log('[refund] Request body:', { 
            refund_destination, 
            amount, 
            amountType: typeof amount,
            currency 
        })

        if (!amount || !currency || !refund_destination) {
            return NextResponse.json(
                { error: 'amount, currency y refund_destination son requeridos' },
                { status: 400 }
            )
        }

        const supabase = createServiceRoleClient()

        // Obtener orden
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, payment:payments(*)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Orden no encontrada' },
                { status: 404 }
            )
        }

        // Verificar que la orden puede ser reembolsada
        if (order.status === 'cancelled' || order.status === 'refunded') {
            return NextResponse.json(
                { error: 'Esta orden ya fue cancelada o reembolsada' },
                { status: 400 }
            )
        }

        // Obtener usuario actual (si está autenticado)
        const authHeader = request.headers.get('authorization')
        let requestedBy: string | null = null
        
        if (authHeader) {
            // Extraer user_id del token si es necesario
            // Por ahora, lo dejamos como null para admin
        }

        // Crear solicitud de reembolso usando RPC para evitar problemas con la vista
        const { data: refundRequestData, error: refundRequestError } = await supabase.rpc('create_refund_request', {
            p_order_id: orderId,
            p_organization_id: order.organization_id,
            p_amount: amount,
            p_currency: currency,
            p_refund_destination: refund_destination,
            p_requested_by: requestedBy || null,
            p_reason: reason || null,
            p_notes: notes || null,
            p_provider: order.payment?.provider || null,
        })

        if (refundRequestError) {
            console.error('Error creando solicitud de reembolso:', refundRequestError)
            return NextResponse.json(
                { error: `Error al crear la solicitud de reembolso: ${refundRequestError.message || JSON.stringify(refundRequestError)}` },
                { status: 500 }
            )
        }

        // La función RPC devuelve un array, tomar el primer elemento
        const refundRequest = Array.isArray(refundRequestData) ? refundRequestData[0] : refundRequestData

        if (!refundRequest) {
            console.error('No se recibió la solicitud de reembolso')
            return NextResponse.json(
                { error: 'No se pudo crear la solicitud de reembolso' },
                { status: 500 }
            )
        }

        // Procesar reembolso según el destino
        let refundResult: any = null
        let providerRefundId: string | undefined

        console.log('[refund] Processing refund, destination:', refund_destination)
        
        if (refund_destination === 'payment_method') {
            // Reembolso a tarjeta original
            console.log('[refund] Processing payment_method refund')
            if (!order.payment) {
                return NextResponse.json(
                    { error: 'No hay información de pago para esta orden' },
                    { status: 400 }
                )
            }

            const payment = order.payment as any

            if (payment.provider === 'stripe') {
                const stripeResult = await createStripeRefund({
                    orderId,
                    paymentId: payment.id,
                    amount,
                    currency,
                    reason,
                })

                if (!stripeResult.success) {
                    // Actualizar solicitud como rechazada usando RPC
                    await supabase.rpc('update_refund_request', {
                        p_refund_request_id: refundRequest.id,
                        p_status: 'rejected',
                        p_notes: `Error: ${stripeResult.error}`,
                    })

                    return NextResponse.json(
                        { error: stripeResult.error || 'Error al procesar el reembolso' },
                        { status: 500 }
                    )
                }

                providerRefundId = stripeResult.refundId
                refundResult = stripeResult
            } else if (payment.provider === 'transbank') {
                // Determinar el tipo de transacción basándose en los metadatos del pago
                const metadata = payment.metadata && typeof payment.metadata === 'object' 
                    ? payment.metadata as any 
                    : {}
                
                const isOneClick = metadata.payment_method === 'oneclick' || !!metadata.tbk_user
                
                let transbankResult: any
                
                if (isOneClick) {
                    // Es una transacción OneClick
                    console.log('[refund] Procesando reembolso OneClick')
                    transbankResult = await createTransbankOneclickRefund({
                        orderId,
                        paymentId: payment.id,
                        amount,
                        currency,
                        reason,
                    })
                } else {
                    // Es una transacción Webpay Plus
                    console.log('[refund] Procesando reembolso Webpay Plus')
                    transbankResult = await createTransbankWebpayRefund({
                        orderId,
                        paymentId: payment.id,
                        amount,
                        currency,
                        reason,
                    })
                }

                if (!transbankResult.success) {
                    await supabase.rpc('update_refund_request', {
                        p_refund_request_id: refundRequest.id,
                        p_status: 'rejected',
                        p_notes: `Error: ${transbankResult.error}`,
                    })

                    return NextResponse.json(
                        { error: transbankResult.error || 'Error al procesar el reembolso' },
                        { status: 500 }
                    )
                }

                providerRefundId = transbankResult.refundId
                refundResult = transbankResult
            } else {
                return NextResponse.json(
                    { error: 'Proveedor de pago no soportado para reembolsos' },
                    { status: 400 }
                )
            }
        } else if (refund_destination === 'wallet') {
            // Reembolso a créditos/monedero
            console.log('[refund] Processing wallet refund')
            const creditsResult = await refundToCredits({
                orderId,
                organizationId: order.organization_id,
                amount,
                currency,
                reason,
            })

            if (!creditsResult.success) {
                await supabase.rpc('update_refund_request', {
                    p_refund_request_id: refundRequest.id,
                    p_status: 'rejected',
                    p_notes: `Error: ${creditsResult.error}`,
                })

                return NextResponse.json(
                    { error: creditsResult.error || 'Error al procesar el reembolso' },
                    { status: 500 }
                )
            }

            providerRefundId = creditsResult.transactionId
            refundResult = creditsResult
        }

        // Actualizar solicitud de reembolso con el resultado usando RPC
        const { data: updatedRefundRequestData, error: updateError } = await supabase.rpc('update_refund_request', {
            p_refund_request_id: refundRequest.id,
            p_status: 'completed',
            p_provider_refund_id: providerRefundId || null,
            p_processed_at: new Date().toISOString(),
        })

        if (updateError) {
            console.error('Error actualizando solicitud de reembolso:', updateError)
        }

        // La función RPC devuelve un array, tomar el primer elemento
        const updatedRefundRequest = Array.isArray(updatedRefundRequestData) && updatedRefundRequestData.length > 0 
            ? updatedRefundRequestData[0] 
            : null

        // Actualizar estado de la orden a 'refunded'
        await supabase
            .from('orders')
            .update({ status: 'refunded' })
            .eq('id', orderId)

        return NextResponse.json({
            success: true,
            refund_request: updatedRefundRequest || refundRequest,
            refund_result: refundResult,
        })
    } catch (error: any) {
        console.error('Error en POST /api/admin/orders/[id]/refund:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

