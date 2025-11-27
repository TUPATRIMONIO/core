import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { addCredits } from '@/lib/credits/core';
import { notifyCreditsAdded, notifyPaymentSucceeded } from '@/lib/notifications/billing';
import { handleTransbankWebhook } from '@/lib/transbank/webhooks';


interface PageProps {
  searchParams: Promise<{ 
    payment_intent?: string;
    provider?: string;
    token_ws?: string;
    TBK_TOKEN?: string;
    type?: string;
  }>;
}

async function PaymentSuccessContent({ 
  paymentIntentId,
  provider,
  tokenWs,
  tbkToken,
  type,
}: { 
  paymentIntentId?: string;
  provider?: string;
  tokenWs?: string;
  tbkToken?: string;
  type?: string;
}) {
  const supabase = await createClient();
  
  // Obtener usuario y organización
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('[PaymentSuccess] No hay usuario autenticado');
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No se encontró información del pago. Verifica tu correo electrónico para más detalles.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Obtener organización del usuario
  const { data: orgUser, error: orgUserError } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (orgUserError || !orgUser) {
    console.error('[PaymentSuccess] Error obteniendo organización:', orgUserError);
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No se encontró información del pago. Verifica tu correo electrónico para más detalles.
          </p>
        </CardContent>
      </Card>
    );
  }

  console.log('[PaymentSuccess] ===== INICIO BÚSQUEDA DE PAGO =====');
  console.log('[PaymentSuccess] Parámetros recibidos:', { 
    paymentIntentId,
    orgId: orgUser.organization_id,
    userId: user.id 
  });
  console.log('[PaymentSuccess] ====================================');

  let payment = null;

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
            console.log('[PaymentSuccess] Inscripción Oneclick completada:', inscriptionData);
            // Aquí podrías guardar el tbk_user en el componente o en la sesión
          }
        } catch (error) {
          console.error('[PaymentSuccess] Error procesando inscripción Oneclick:', error);
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
        console.error('[PaymentSuccess] Error buscando pago Transbank:', error);
      } else if (data) {
        console.log('[PaymentSuccess] Pago Transbank encontrado:', data.id);
        
        // Si el pago está pendiente, procesar webhook
        if (data.status === 'pending') {
          try {
            const webhookType = data.metadata?.payment_method === 'oneclick' ? 'oneclick' : 'webpay_plus';
            
            console.log('[PaymentSuccess] Procesando webhook directamente:', { token: token.substring(0, 20) + '...', type: webhookType });
            
            // Llamar directamente a la función del webhook en lugar de hacer fetch
            const webhookResult = await handleTransbankWebhook(token, webhookType);
            
            if (webhookResult.success) {
              console.log('[PaymentSuccess] Webhook procesado exitosamente');
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
              console.error('[PaymentSuccess] Error en webhook:', webhookResult.error);
              payment = data; // Usar datos existentes
            }
          } catch (error) {
            console.error('[PaymentSuccess] Error procesando webhook:', error);
            payment = data; // Usar datos existentes
          }
        } else {
          payment = data;
        }
      } else {
        console.warn('[PaymentSuccess] No se encontró pago Transbank con token:', token);
      }
    }
  } else if (paymentIntentId) {
    // Pago de Stripe
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
      .eq('provider_payment_id', paymentIntentId)
      .eq('provider', 'stripe')
      .maybeSingle();
    
    if (error) {
      console.error('[PaymentSuccess] Error buscando pago Stripe:', error);
    } else if (data) {
      console.log('[PaymentSuccess] Pago Stripe encontrado:', data.id);
    } else {
      console.warn('[PaymentSuccess] No se encontró pago Stripe con ID:', paymentIntentId);
    }
    payment = data;
  }

  // Verificar y procesar créditos para pagos encontrados
  if (payment) {
    console.log('[PaymentSuccess] Pago encontrado, verificando estado y créditos:', {
      paymentId: payment.id,
      currentStatus: payment.status,
      providerPaymentId: payment.provider_payment_id,
      invoiceId: payment.invoice_id,
      invoiceType: payment.invoice?.type
    });
    
    // Si el pago ya está succeeded pero es compra de créditos, verificar que los créditos se hayan cargado
    if (payment.status === 'succeeded' && payment.invoice?.type === 'credit_purchase') {
      console.log('[PaymentSuccess] Pago succeeded, verificando si los créditos se cargaron...');
      
      // Verificar si los créditos ya se cargaron buscando transacciones de créditos para esta factura
      // El tipo es 'earned' cuando se agregan créditos
      const invoiceIdStr = payment.invoice.id;
      const paymentIdStr = payment.id;
      
      console.log('[PaymentSuccess] Buscando transacciones de créditos:', {
        orgId: orgUser.organization_id,
        invoiceId: invoiceIdStr,
        paymentId: paymentIdStr
      });
      
      // Buscar transacciones que tengan el invoice_id o payment_id en metadata
      const { data: allTransactions, error: creditSearchError } = await supabase
        .from('credit_transactions')
        .select('id, amount, type, metadata, description')
        .eq('organization_id', orgUser.organization_id)
        .eq('type', 'earned')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (creditSearchError) {
        console.error('[PaymentSuccess] Error buscando transacciones de créditos:', creditSearchError);
      }
      
      // Filtrar manualmente las transacciones que coincidan con nuestro invoice_id o payment_id
      const creditTransactions = allTransactions?.filter((t: any) => {
        const metadata = t.metadata || {};
        return metadata.invoice_id === invoiceIdStr || metadata.payment_id === paymentIdStr;
      }) || [];
      
      console.log('[PaymentSuccess] Transacciones de créditos encontradas:', {
        totalTransactions: allTransactions?.length || 0,
        matchingTransactions: creditTransactions.length,
        transactions: creditTransactions,
        invoiceId: invoiceIdStr,
        paymentId: paymentIdStr
      });
      
      if (!creditTransactions || creditTransactions.length === 0) {
        console.log('[PaymentSuccess] No se encontraron transacciones de créditos, procesando créditos ahora...');
        // Los créditos no se cargaron, procesarlos ahora
        try {
          let creditsAmount = 0;
          
          if (payment.metadata?.credits_amount) {
            creditsAmount = parseFloat(payment.metadata.credits_amount.toString());
          } else if (payment.invoice) {
            // Buscar en invoice line items
            const { data: lineItems } = await supabase
              .from('invoice_line_items')
              .select('description')
              .eq('invoice_id', payment.invoice.id)
              .limit(1)
              .maybeSingle();
            
            if (lineItems?.description) {
              const creditsMatch = lineItems.description.match(/(\d+)\s*créditos/i);
              creditsAmount = creditsMatch ? parseFloat(creditsMatch[1]) : 0;
            }
          }
          
          if (creditsAmount > 0) {
            console.log(`[PaymentSuccess] Agregando ${creditsAmount} créditos...`, {
              orgId: orgUser.organization_id,
              creditsAmount,
              paymentId: payment.id,
              invoiceId: payment.invoice.id,
              metadata: {
                payment_id: payment.id,
                stripe_payment_intent_id: payment.provider_payment_id,
                invoice_id: payment.invoice.id,
              }
            });
            
            try {
              const transactionId = await addCredits(
                orgUser.organization_id,
                creditsAmount,
                'credit_purchase',
                {
                  payment_id: payment.id,
                  stripe_payment_intent_id: payment.provider_payment_id,
                  invoice_id: payment.invoice.id,
                }
              );
              
              console.log('[PaymentSuccess] Créditos procesados exitosamente:', {
                transactionId,
                creditsAmount,
                orgId: orgUser.organization_id
              });
              
              // Notificar créditos agregados
              try {
                await notifyCreditsAdded(
                  orgUser.organization_id,
                  creditsAmount,
                  'credit_purchase',
                  payment.invoice.id
                );
                console.log('[PaymentSuccess] Notificación de créditos enviada');
              } catch (notifError: any) {
                console.error('[PaymentSuccess] Error enviando notificación de créditos:', notifError);
              }
            } catch (addCreditsError: any) {
              console.error('[PaymentSuccess] Error en addCredits:', {
                error: addCreditsError.message,
                stack: addCreditsError.stack,
                orgId: orgUser.organization_id,
                creditsAmount
              });
              // No lanzar el error, solo loguearlo para que el mensaje de éxito se muestre
            }
          } else {
            console.warn('[PaymentSuccess] No se pudo determinar la cantidad de créditos:', {
              metadata: payment.metadata,
              invoiceId: payment.invoice?.id
            });
          }
        } catch (error: any) {
          console.error('[PaymentSuccess] Error procesando créditos:', {
            error: error.message,
            stack: error.stack
          });
          // No lanzar el error, solo loguearlo para que el mensaje de éxito se muestre
        }
      } else {
        console.log('[PaymentSuccess] Los créditos ya fueron cargados anteriormente');
      }
    }
  }

  if (!payment) {
    console.error('[PaymentSuccess] No se encontró ningún pago');
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No se encontró información del pago. Verifica tu correo electrónico para más detalles.
          </p>
        </CardContent>
      </Card>
    );
  }

  console.log('[PaymentSuccess] Pago encontrado exitosamente:', {
    id: payment.id,
    invoice_number: payment.invoice?.invoice_number,
    status: payment.status
  });
  
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
        <CardDescription>
          Tu compra de créditos se ha procesado correctamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {payment && (
          <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Número de factura</span>
              <span className="font-mono font-semibold">
                {payment.invoice?.invoice_number || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto pagado</span>
              <span className="font-semibold">
                {payment.invoice?.currency && payment.invoice?.total
                  ? new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: payment.invoice.currency,
                    }).format(payment.invoice.total)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Completado
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
            <Link href="/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Ver Facturación
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard">
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> Los créditos se agregarán automáticamente a tu cuenta en unos momentos.
            Si no ves los créditos reflejados, por favor espera unos minutos y recarga la página.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const paymentIntentId = params.payment_intent;
  const provider = params.provider;
  const tokenWs = params.token_ws;
  const tbkToken = params.TBK_TOKEN;
  const type = params.type;
  
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Suspense fallback={
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando información del pago...</p>
          </CardContent>
        </Card>
      }>
        <PaymentSuccessContent 
          paymentIntentId={paymentIntentId}
          provider={provider}
          tokenWs={tokenWs}
          tbkToken={tbkToken}
          type={type}
        />
      </Suspense>
    </div>
  );
}

