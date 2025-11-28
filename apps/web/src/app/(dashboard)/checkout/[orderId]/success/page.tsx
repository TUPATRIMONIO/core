import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight, CreditCard, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { getOrder } from '@/lib/checkout/core';
import { notFound, redirect } from 'next/navigation';
import { addCredits } from '@/lib/credits/core';
import { handleTransbankWebhook } from '@/lib/transbank/webhooks';

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ 
    provider?: string;
    token_ws?: string;
    TBK_TOKEN?: string;
    TBK_ORDEN_COMPRA?: string;
    TBK_ID_SESION?: string;
    type?: string;
    method?: string;
  }>;
}

async function OrderSuccessContent({ 
  orderId,
  provider,
  tokenWs,
  tbkToken,
  tbkOrdenCompra,
  tbkIdSesion,
  type,
  method,
  searchParams,
}: { 
  orderId: string;
  provider?: string;
  tokenWs?: string;
  tbkToken?: string;
  tbkOrdenCompra?: string;
  tbkIdSesion?: string;
  type?: string;
  method?: string;
  searchParams?: any;
}) {
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Obtener orden
  const order = await getOrder(orderId);
  if (!order) {
    notFound();
  }

  // Verificar que el usuario pertenece a la organización de la orden
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', order.organization_id)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
    notFound();
  }

  let payment = null;
  let isCancelled = false;

  // Manejar diferentes proveedores de pago
  if (provider === 'transbank') {
    // Pago de Transbank
    const token = tokenWs || tbkToken;
    const isOneclick = type === 'oneclick' || searchParams.method === 'oneclick';
    
    if (token) {
      // Si es inscripción Oneclick, procesarla primero
      if (type === 'oneclick_inscription') {
        try {
          const inscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transbank/oneclick/inscription/finish?token=${token}`, {
            method: 'POST',
          });
          
          if (inscriptionResponse.ok) {
            const inscriptionData = await inscriptionResponse.json();
            console.log('[OrderSuccess] Inscripción Oneclick completada:', inscriptionData);
          }
        } catch (error) {
          console.error('[OrderSuccess] Error procesando inscripción Oneclick:', error);
        }
      }
      
      // Buscar pago por token
      console.log('[OrderSuccess] Buscando pago con token:', {
        token,
        tokenLength: token.length,
        isOneclick,
        provider,
        method: searchParams?.method,
      });

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            total,
            currency,
            id,
            organization_id,
            type
          )
        `)
        .eq('provider_payment_id', token)
        .eq('provider', 'transbank')
        .maybeSingle();
      
      if (error) {
        console.error('[OrderSuccess] Error buscando pago Transbank:', error);
      } else if (data) {
        console.log('[OrderSuccess] Pago Transbank encontrado:', {
          id: data.id,
          status: data.status,
          provider_payment_id: data.provider_payment_id,
          payment_method: data.metadata?.payment_method,
        });
        
        // Si el pago está pendiente, procesar webhook
        if (data.status === 'pending') {
          try {
            const webhookType = data.metadata?.payment_method === 'oneclick' ? 'oneclick' : 'webpay_plus';
            
            console.log('[OrderSuccess] Procesando webhook directamente:', { token: token.substring(0, 20) + '...', type: webhookType });
            
            // Llamar directamente a la función del webhook en lugar de hacer fetch
            const webhookResult = await handleTransbankWebhook(token, webhookType);
            
            if (webhookResult.success) {
              console.log('[OrderSuccess] Webhook procesado exitosamente');
              // Recargar datos del pago
              const { data: updatedPayment } = await supabase
                .from('payments')
                .select(`
                  *,
                  invoice:invoices (
                    invoice_number,
                    total,
                    currency,
                    id,
                    organization_id,
                    type
                  )
                `)
                .eq('id', data.id)
                .single();
              
              payment = updatedPayment || data;
            } else {
              console.error('[OrderSuccess] Error en webhook:', webhookResult.error);
              payment = data; // Usar datos existentes
            }
          } catch (error) {
            console.error('[OrderSuccess] Error procesando webhook:', error);
            payment = data; // Usar datos existentes
          }
        } else {
          payment = data;
        }
      } else {
        console.warn('[OrderSuccess] No se encontró pago Transbank con token:', {
          token,
          isOneclick,
        });
        
        // Si es Oneclick y no encontramos por token, buscar por orderId
        if (isOneclick) {
          console.log('[OrderSuccess] Intentando buscar por orderId...');
          const { data: orderPayments, error: orderPaymentsError } = await supabase
            .from('payments')
            .select(`
              *,
              invoice:invoices (
                invoice_number,
                total,
                currency,
                id,
                organization_id,
                type
              )
            `)
            .eq('provider', 'transbank')
            .eq('metadata->>order_id', orderId)
            .eq('metadata->>payment_method', 'oneclick')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (orderPaymentsError) {
            console.error('[OrderSuccess] Error buscando pago Oneclick por orderId:', orderPaymentsError);
          } else if (orderPayments) {
            console.log('[OrderSuccess] Pago Oneclick encontrado por orderId:', orderPayments.id);
            payment = orderPayments;
          }
        }
      }
    } else if (isOneclick) {
      // Si es Oneclick y no hay token, buscar el último pago de la orden
      console.log('[OrderSuccess] Buscando pago Oneclick por orderId:', orderId);
      const { data: orderPayments, error: orderPaymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            total,
            currency,
            id,
            organization_id,
            type
          )
        `)
        .eq('provider', 'transbank')
        .eq('metadata->>order_id', orderId)
        .eq('metadata->>payment_method', 'oneclick')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (orderPaymentsError) {
        console.error('[OrderSuccess] Error buscando pago Oneclick por orderId:', orderPaymentsError);
      } else if (orderPayments) {
        console.log('[OrderSuccess] Pago Oneclick encontrado por orderId:', orderPayments.id);
        payment = orderPayments;
      }
    } else if (tbkToken && !tokenWs) {
      // Si solo viene TBK_TOKEN sin token_ws, probablemente fue cancelado
      isCancelled = true;
      console.log('[OrderSuccess] Transacción cancelada por el usuario');
    }
  } else if (provider === 'stripe') {
    // Pago de Stripe
    const sessionId = searchParams?.session_id;
    
    if (sessionId) {
      console.log('[OrderSuccess] Buscando pago Stripe con session_id:', sessionId);
      
      // Buscar pago por orderId y provider Stripe
      // El webhook ya debería haber procesado el pago, pero buscamos el más reciente
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            total,
            currency,
            id,
            organization_id,
            type
          )
        `)
        .eq('provider', 'stripe')
        .eq('metadata->>order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('[OrderSuccess] Error buscando pago Stripe:', error);
      } else if (data) {
        console.log('[OrderSuccess] Pago Stripe encontrado:', {
          id: data.id,
          status: data.status,
          provider_payment_id: data.provider_payment_id,
        });
        payment = data;
      } else {
        // Si no encontramos el pago, puede que el webhook aún no lo haya procesado
        // Buscar por payment_intent_id si tenemos el session_id
        console.log('[OrderSuccess] No se encontró pago, el webhook puede estar procesándolo aún');
      }
    } else {
      // Si no hay session_id, buscar el último pago de Stripe para esta orden
      console.log('[OrderSuccess] Buscando último pago Stripe por orderId:', orderId);
      const { data: orderPayments, error: orderPaymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            total,
            currency,
            id,
            organization_id,
            type
          )
        `)
        .eq('provider', 'stripe')
        .eq('metadata->>order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (orderPaymentsError) {
        console.error('[OrderSuccess] Error buscando pago Stripe por orderId:', orderPaymentsError);
      } else if (orderPayments) {
        console.log('[OrderSuccess] Pago Stripe encontrado por orderId:', orderPayments.id);
        payment = orderPayments;
      }
    }
  }

  // Obtener datos del producto
  const productData = order.product_data as any;

  // Si el pago fue exitoso, verificar créditos y mostrar mensaje de éxito
  const isPaymentSuccess = payment && payment.status === 'succeeded';
  
  if (isPaymentSuccess) {
    // Si es compra de créditos, verificar que los créditos se hayan cargado
    if (payment.invoice?.type === 'credit_purchase' || order.product_type === 'credits') {
      console.log('[OrderSuccess] Pago succeeded, verificando si los créditos se cargaron...');
      
      // Verificar si los créditos ya se cargaron buscando transacciones de créditos
      const invoiceIdStr = payment.invoice?.id;
      const paymentIdStr = payment.id;
      
      const { data: allTransactions, error: creditSearchError } = await supabase
        .from('credit_transactions')
        .select('id, amount, type, metadata, description')
        .eq('organization_id', order.organization_id)
        .eq('type', 'earned')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (creditSearchError) {
        console.error('[OrderSuccess] Error buscando transacciones de créditos:', creditSearchError);
      }
      
      // Filtrar transacciones que coincidan con nuestro invoice_id o payment_id
      const creditTransactions = allTransactions?.filter((t: any) => {
        const metadata = t.metadata || {};
        return metadata.invoice_id === invoiceIdStr || metadata.payment_id === paymentIdStr;
      }) || [];
      
      console.log('[OrderSuccess] Transacciones de créditos encontradas:', {
        totalTransactions: allTransactions?.length || 0,
        matchingTransactions: creditTransactions.length,
        invoiceId: invoiceIdStr,
        paymentId: paymentIdStr
      });
      
      // Si no se encontraron créditos, intentar cargarlos
      if (!creditTransactions || creditTransactions.length === 0) {
        console.log('[OrderSuccess] No se encontraron transacciones de créditos, procesando créditos ahora...');
        
        try {
          let creditsAmount = 0;
          
          if (payment.metadata?.credits_amount) {
            creditsAmount = parseFloat(payment.metadata.credits_amount.toString());
          } else if (productData?.credits_amount) {
            creditsAmount = parseFloat(productData.credits_amount.toString());
          }
          
          if (creditsAmount > 0) {
            console.log(`[OrderSuccess] Agregando ${creditsAmount} créditos...`, {
              orgId: order.organization_id,
              creditsAmount,
              paymentId: payment.id,
              invoiceId: payment.invoice?.id,
            });
            
            try {
              const transactionId = await addCredits(
                order.organization_id,
                creditsAmount,
                'credit_purchase',
                {
                  payment_id: payment.id,
                  transbank_token: tokenWs || tbkToken,
                  invoice_id: payment.invoice?.id,
                  order_id: orderId,
                }
              );
              
              console.log('[OrderSuccess] Créditos procesados exitosamente:', {
                transactionId,
                creditsAmount,
                orgId: order.organization_id
              });
            } catch (addCreditsError: any) {
              console.error('[OrderSuccess] Error en addCredits:', {
                error: addCreditsError.message,
                stack: addCreditsError.stack,
                orgId: order.organization_id,
                creditsAmount
              });
            }
          } else {
            console.warn('[OrderSuccess] No se pudo determinar la cantidad de créditos:', {
              metadata: payment.metadata,
              productData: productData,
              invoiceId: payment.invoice?.id
            });
          }
        } catch (error: any) {
          console.error('[OrderSuccess] Error procesando créditos:', {
            error: error.message,
            stack: error.stack
          });
        }
      } else {
        console.log('[OrderSuccess] Los créditos ya fueron cargados anteriormente');
      }
    }
    
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Tu orden ha sido pagada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Número de orden</span>
              <span className="font-mono font-semibold">
                {order.order_number}
              </span>
            </div>
            {payment.invoice && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Número de factura</span>
                  <span className="font-mono font-semibold">
                    {payment.invoice.invoice_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monto pagado</span>
                  <span className="font-semibold">
                    {payment.invoice.currency && payment.invoice.total
                      ? new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: payment.invoice.currency,
                        }).format(payment.invoice.total)
                      : 'N/A'}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Completado
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              <Link href="/orders">
                <CreditCard className="mr-2 h-4 w-4" />
                Ver Mis Órdenes
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard">
                Ir al Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si fue cancelado, mostrar mensaje de cancelación
  if (isCancelled || (payment && payment.status === 'failed')) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Pago Cancelado</CardTitle>
          <CardDescription>
            El pago fue cancelado o no se pudo completar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isCancelled 
                ? 'Has cancelado el pago. Tu orden sigue pendiente y puedes intentar pagar nuevamente.'
                : 'El pago no se pudo procesar correctamente. Por favor intenta nuevamente.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Número de orden</span>
              <span className="font-mono font-semibold">
                {order.order_number}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto</span>
              <span className="font-semibold">
                {order.currency && order.amount
                  ? new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(order.amount)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                Pendiente
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              <Link href={`/checkout/${orderId}`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Intentar Pagar Nuevamente
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/orders">
                Ver Mis Órdenes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado pendiente o desconocido
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
          <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl">Procesando Pago</CardTitle>
        <CardDescription>
          Estamos verificando el estado de tu pago
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Número de orden</span>
            <span className="font-mono font-semibold">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monto</span>
            <span className="font-semibold">
              {order.currency && order.amount
                ? new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: order.currency,
                  }).format(order.amount)
                : 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/checkout/${orderId}`}>
              Ver Detalles de la Orden
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/orders">
              Ver Mis Órdenes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const params_search = await searchParams;
  const provider = params_search.provider;
  const tokenWs = params_search.token_ws;
  const tbkToken = params_search.TBK_TOKEN;
  const tbkOrdenCompra = params_search.TBK_ORDEN_COMPRA;
  const tbkIdSesion = params_search.TBK_ID_SESION;
  const type = params_search.type;
  const method = params_search.method;
  
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Suspense fallback={
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando información del pago...</p>
          </CardContent>
        </Card>
      }>
        <OrderSuccessContent 
          orderId={orderId}
          provider={provider}
          tokenWs={tokenWs}
          tbkToken={tbkToken}
          tbkOrdenCompra={tbkOrdenCompra}
          tbkIdSesion={tbkIdSesion}
          type={type}
          method={method}
          searchParams={params_search}
        />
      </Suspense>
    </div>
  );
}

