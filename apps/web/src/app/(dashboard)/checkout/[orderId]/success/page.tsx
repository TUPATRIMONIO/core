import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight, CreditCard, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { getOrder, updateOrderStatus } from '@/lib/checkout/core';
import { notFound, redirect } from 'next/navigation';
import { addCredits } from '@/lib/credits/core';
import { verifyPaymentForOrder, getPaymentById } from '@/lib/payments/verification';
import { getPaymentProvider, isProviderAvailable } from '@/lib/payments/provider-factory';


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
    session_id?: string;
    paymentId?: string;
    status?: string;
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

  // Verificar que la orden pertenece a la organización activa del usuario
  const { getUserActiveOrganization } = await import('@/lib/organization/utils');
  const { organization: activeOrg } = await getUserActiveOrganization(supabase);
  
  if (!activeOrg || activeOrg.id !== order.organization_id) {
    notFound();
  }

  let payment = null;
  let isCancelled = false;

  // Manejar diferentes proveedores de pago usando servicio unificado
  if (provider && isProviderAvailable(provider)) {
    // Manejo especial para inscripción Oneclick de Transbank
    if (provider === 'transbank' && type === 'oneclick_inscription' && (tokenWs || tbkToken)) {
      const token = tokenWs || tbkToken;
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

    // Detectar cancelación por parámetros específicos de Transbank
    if (provider === 'transbank' && tbkToken && !tokenWs) {
      // Si solo viene TBK_TOKEN sin token_ws, probablemente fue cancelado
      isCancelled = true;
      console.log('[OrderSuccess] Transacción cancelada por el usuario');
    } else {
      try {
        const paymentProvider = getPaymentProvider(provider);
        
        // Construir parámetros de verificación según el proveedor
        const verifyParams: any = {
          orderId,
          organizationId: order.organization_id,
        };
        
        // Agregar parámetros específicos según lo que venga en searchParams
        if (tokenWs) verifyParams.token = tokenWs;
        if (tbkToken) verifyParams.token = tbkToken;
        if (searchParams?.session_id) verifyParams.sessionId = searchParams.session_id;
        if (searchParams?.paymentId) verifyParams.token = searchParams.paymentId;
        if (type) verifyParams.type = type;
        if (method) verifyParams.method = method;
        
        // Verificar pago con el proveedor
        const verification = await paymentProvider.verifyPayment(verifyParams);
        
        if (verification.success && verification.status === 'succeeded') {
          // Buscar el pago en BD para mostrar detalles
          const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('id', verification.paymentId)
            .single();
          
          payment = paymentData;
        } else if (verification.status === 'failed') {
          isCancelled = true;
        } else if (verification.paymentId) {
          // Si hay paymentId pero está pending, obtener el pago para mostrar estado
          const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('id', verification.paymentId)
            .single();
          
          payment = paymentData;
        }
        // Si está pending sin paymentId, payment quedará null y se mostrará "Procesando"
      } catch (error) {
        console.error('[OrderSuccess] Error verificando pago:', error);
        // No marcar como cancelado, dejar en estado pendiente
      }
    }
  }

  // Obtener datos del producto
  const productData = order.product_data as any;

  // Detectar si es una orden gratuita (monto $0)
  const isZeroAmountOrder = order.amount === 0;
  
  // Si es orden gratuita y ya está pagada, mostrar éxito directamente
  const isFreeOrderPaid = isZeroAmountOrder && (order.status === 'paid' || order.status === 'completed');

  // Si el pago fue exitoso, verificar créditos y mostrar mensaje de éxito
  const isPaymentSuccess = (payment && payment.status === 'succeeded') || isFreeOrderPaid;
  
  if (isPaymentSuccess) {
    // Si es compra de créditos (y no es gratuita), verificar que los créditos se hayan cargado
    if (order.product_type === 'credits' && payment) {
      console.log('[OrderSuccess] Pago succeeded, verificando si los créditos se cargaron...');
      
      // Verificar si los créditos ya se cargaron buscando transacciones de créditos
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
      
      // Filtrar transacciones que coincidan con nuestro payment_id
      const creditTransactions = allTransactions?.filter((t: any) => {
        const metadata = t.metadata || {};
        return metadata.payment_id === paymentIdStr;
      }) || [];
      
      console.log('[OrderSuccess] Transacciones de créditos encontradas:', {
        totalTransactions: allTransactions?.length || 0,
        matchingTransactions: creditTransactions.length,
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
              orderId: orderId,
            });
            
            try {
              const transactionId = await addCredits(
                order.organization_id,
                creditsAmount,
                'credit_purchase',
                {
                  payment_id: payment.id,
                  transbank_token: tokenWs || tbkToken,
                  order_id: orderId,
                }
              );
              
              console.log('[OrderSuccess] Créditos procesados exitosamente:', {
                transactionId,
                creditsAmount,
                orgId: order.organization_id
              });
              
              // Actualizar orden a 'completed' después de cargar los créditos exitosamente
              // Solo si la orden está en estado 'paid' (no saltar directamente desde 'pending_payment')
              try {
                // Recargar el estado actual de la orden desde la BD para asegurar que esté actualizado
                const { data: currentOrder } = await supabase
                  .from('orders')
                  .select('id, status')
                  .eq('id', orderId)
                  .single();
                
                if (currentOrder && currentOrder.status === 'paid') {
                  await updateOrderStatus(orderId, 'completed', {
                    paymentId: payment.id,
                  });
                  console.log('[OrderSuccess] Orden actualizada a completed después de cargar créditos');
                } else {
                  console.log('[OrderSuccess] Orden no está en estado paid, no se actualiza a completed:', {
                    currentStatus: currentOrder?.status,
                    orderId
                  });
                }
              } catch (completedError: any) {
                console.error('[OrderSuccess] Error actualizando orden a completed:', completedError);
              }
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
        
        // Si los créditos ya fueron cargados, verificar si la orden debe actualizarse a completed
        try {
          const { data: currentOrder } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', orderId)
            .single();
          
          if (currentOrder && currentOrder.status === 'paid') {
            await updateOrderStatus(orderId, 'completed', {
              paymentId: payment.id,
            });
            console.log('[OrderSuccess] Orden actualizada a completed (créditos ya cargados previamente)');
          }
        } catch (completedError: any) {
          console.error('[OrderSuccess] Error actualizando orden a completed (créditos ya cargados):', completedError);
        }
      }
    }

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">
            {isZeroAmountOrder ? '¡Pedido Confirmado!' : '¡Pago Exitoso!'}
          </CardTitle>
          <CardDescription>
            {isZeroAmountOrder 
              ? 'Tu pedido ha sido registrado correctamente' 
              : 'Tu orden ha sido pagada correctamente'}
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
              <span className="text-sm text-muted-foreground">{isZeroAmountOrder ? 'Monto' : 'Monto pagado'}</span>
              <span className="font-semibold">
                {order.currency && order.amount !== null && order.amount !== undefined
                  ? new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(order.amount)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {isZeroAmountOrder ? 'Confirmado' : 'Pagado'}
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
                {order.currency && order.amount !== null && order.amount !== undefined
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
              {order.currency && order.amount !== null && order.amount !== undefined
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

