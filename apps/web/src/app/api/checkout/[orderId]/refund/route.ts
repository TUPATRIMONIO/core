import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createStripeRefund } from '@/lib/stripe/refunds'
import { createTransbankWebpayRefund, createTransbankOneclickRefund } from '@/lib/transbank/refunds'
import { refundToCredits } from '@/lib/credits/refunds'

interface RouteParams {
    params: Promise<{ orderId: string }>
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { orderId } = await params
        const body = await request.json()
        const { 
            amount, 
            currency, 
            refund_destination, 
            reason,
            notes 
        } = body

        if (!amount || !currency || !refund_destination) {
            return NextResponse.json(
                { error: 'amount, currency y refund_destination son requeridos' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        // Obtener orden con ServiceRole para acceso completo
        const serviceSupabase = createServiceRoleClient()
        const { data: order, error: orderError } = await serviceSupabase
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

        // Verificar que el usuario pertenece a la organización de la orden
        const { data: orgUser, error: orgUserError } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('organization_id', order.organization_id)
            .eq('status', 'active')
            .single()

        if (orgUserError || !orgUser) {
            return NextResponse.json(
                { error: 'No tienes permiso para solicitar reembolsos de esta orden' },
                { status: 403 }
            )
        }

        // Verificar que la orden puede ser reembolsada
        if (order.status === 'cancelled' || order.status === 'refunded') {
            return NextResponse.json(
                { error: 'Esta orden ya fue cancelada o reembolsada' },
                { status: 400 }
            )
        }

        if (order.status !== 'completed' && order.status !== 'paid') {
            return NextResponse.json(
                { error: 'Solo se pueden reembolsar órdenes completadas o pagadas' },
                { status: 400 }
            )
        }

        // Verificar que hay un pago asociado
        if (!order.payment) {
            return NextResponse.json(
                { error: 'Esta orden no tiene un pago asociado' },
                { status: 400 }
            )
        }

        // Crear solicitud de reembolso usando RPC
        const { data: refundRequestData, error: refundRequestError } = await serviceSupabase.rpc('create_refund_request', {
            p_order_id: orderId,
            p_organization_id: order.organization_id,
            p_amount: amount,
            p_currency: currency,
            p_refund_destination: refund_destination,
            p_requested_by: user.id,
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
            // Reemborso al método de pago original
            let provider = order.payment?.provider
            
            // Normalizar proveedor de Transbank: si es 'transbank', determinar si es webpay o oneclick
            if (provider === 'transbank' && order.payment?.metadata) {
                const metadata = order.payment.metadata as any
                // Detectar Oneclick: tiene payment_method: 'oneclick', store_commerce_code, o store_buy_order
                if (metadata.payment_method === 'oneclick' || 
                    metadata.store_commerce_code || 
                    metadata.store_buy_order ||
                    metadata.detail_buy_order) {
                    provider = 'transbank_oneclick'
                } 
                // Detectar Webpay: tiene session_id o buy_order sin indicadores de oneclick
                else if (metadata.session_id || metadata.buy_order) {
                    provider = 'transbank_webpay'
                }
                // Si no se puede determinar, intentar usar el provider_payment_id como indicador
                // Los tokens de Webpay suelen ser más largos y diferentes de los buy_orders de Oneclick
                else if (order.payment?.provider_payment_id) {
                    const paymentId = order.payment.provider_payment_id
                    // Los buy_orders de Oneclick suelen tener formato específico, pero por seguridad
                    // si no hay metadata clara, asumimos webpay (más común)
                    provider = 'transbank_webpay'
                }
            }

            console.log('[refund] Provider detected:', {
                provider,
                original: order.payment?.provider,
                metadata: order.payment?.metadata,
            })

            if (provider === 'stripe') {
                const stripeResult = await createStripeRefund({
                    orderId,
                    paymentId: order.payment.id,
                    amount,
                    currency,
                    reason: reason || undefined,
                })

                if (!stripeResult.success) {
                    throw new Error(stripeResult.error || 'Error procesando reembolso de Stripe')
                }

                refundResult = stripeResult
                providerRefundId = stripeResult.refundId
            } else if (provider === 'transbank_webpay') {
                const transbankResult = await createTransbankWebpayRefund({
                    orderId,
                    paymentId: order.payment.id,
                    amount,
                    currency,
                })

                if (!transbankResult.success) {
                    throw new Error(transbankResult.error || 'Error procesando reembolso de Transbank Webpay')
                }

                refundResult = transbankResult
                providerRefundId = transbankResult.refundId
            } else if (provider === 'transbank_oneclick') {
                const transbankResult = await createTransbankOneclickRefund({
                    orderId,
                    paymentId: order.payment.id,
                    amount,
                    currency,
                })

                if (!transbankResult.success) {
                    throw new Error(transbankResult.error || 'Error procesando reembolso de Transbank OneClick')
                }

                refundResult = transbankResult
                providerRefundId = transbankResult.refundId
            } else {
                // Si aún es 'transbank' sin normalizar, dar un error más descriptivo
                if (provider === 'transbank') {
                    throw new Error(
                        `No se pudo determinar el tipo de pago Transbank. ` +
                        `Por favor contacta al soporte con el número de orden ${order.order_number}.`
                    )
                }
                throw new Error(`Proveedor de pago no soportado para reembolsos: ${provider}`)
            }
        } else if (refund_destination === 'wallet') {
            // Reembolso al monedero (créditos)
            const creditsResult = await refundToCredits({
                orderId,
                organizationId: order.organization_id,
                amount,
                currency,
                reason: reason || undefined,
            })

            if (!creditsResult.success) {
                throw new Error(creditsResult.error || 'Error procesando reembolso a créditos')
            }

            refundResult = creditsResult
        } else {
            throw new Error(`Destino de reembolso no válido: ${refund_destination}`)
        }

        // Actualizar solicitud de reembolso con el resultado usando RPC (evita problemas con la vista)
        const { error: updateError } = await serviceSupabase.rpc('update_refund_request', {
            p_refund_request_id: refundRequest.id,
            p_status: 'completed',
            p_provider_refund_id: providerRefundId || null,
            p_processed_at: new Date().toISOString(),
        })

        if (updateError) {
            console.error('Error actualizando solicitud de reembolso:', updateError)
            // No fallar la petición si solo falla la actualización
        }

        // Si el reembolso es por el monto completo, actualizar estado de la orden
        if (parseFloat(amount) >= order.amount) {
            const { error: orderUpdateError } = await serviceSupabase
                .from('orders')
                .update({ status: 'refunded' })
                .eq('id', orderId)

            if (orderUpdateError) {
                console.error('Error actualizando estado de orden:', orderUpdateError)
            }
        }

        return NextResponse.json({
            success: true,
            refund_request: refundRequest,
            refund_result: refundResult,
        })
    } catch (error: any) {
        console.error('Error procesando reembolso:', error)
        return NextResponse.json(
            { error: error.message || 'Error al procesar el reembolso' },
            { status: 500 }
        )
    }
}

