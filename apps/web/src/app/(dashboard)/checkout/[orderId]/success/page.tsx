import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight, CreditCard, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { getOrder } from '@/lib/checkout/core';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ 
    provider?: string;
    token_ws?: string;
    TBK_TOKEN?: string;
    TBK_ORDEN_COMPRA?: string;
    TBK_ID_SESION?: string;
    type?: string;
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
}: { 
  orderId: string;
  provider?: string;
  tokenWs?: string;
  tbkToken?: string;
  tbkOrdenCompra?: string;
  tbkIdSesion?: string;
  type?: string;
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
        console.log('[OrderSuccess] Pago Transbank encontrado:', data.id);
        
        // Si el pago está pendiente, procesar webhook
        if (data.status === 'pending') {
          try {
            const webhookType = data.metadata?.payment_method === 'oneclick' ? 'oneclick' : 'webpay_plus';
            const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transbank/webhook`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token,
                type: webhookType,
              }),
            });
            
            if (webhookResponse.ok) {
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
            }
          } catch (error) {
            console.error('[OrderSuccess] Error procesando webhook:', error);
            payment = data; // Usar datos existentes
          }
        } else {
          payment = data;
        }
      } else {
        console.warn('[OrderSuccess] No se encontró pago Transbank con token:', token);
      }
    } else if (tbkToken && !tokenWs) {
      // Si solo viene TBK_TOKEN sin token_ws, probablemente fue cancelado
      isCancelled = true;
      console.log('[OrderSuccess] Transacción cancelada por el usuario');
    }
  }

  // Obtener datos del producto
  const productData = order.product_data as any;

  // Si el pago fue exitoso, mostrar mensaje de éxito
  if (payment && payment.status === 'succeeded') {
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
              <Link href="/checkout">
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
              <Link href="/checkout">
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
            <Link href="/checkout">
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
        />
      </Suspense>
    </div>
  );
}

