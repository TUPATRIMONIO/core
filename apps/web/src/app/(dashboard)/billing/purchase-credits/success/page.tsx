import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { getPaymentStatus } from '@/lib/dlocal/client';
import { addCredits } from '@/lib/credits/core';
import { notifyCreditsAdded, notifyPaymentSucceeded } from '@/lib/notifications/billing';

/**
 * Procesa un pago que está PAID en dLocal Go pero aún pending en nuestra BD
 * Actualiza el estado del pago, la factura y procesa los créditos
 */
async function processPaidPayment(
  payment: any,
  dLocalPaymentStatus: any,
  supabase: any,
  orgId: string
) {
  console.log('[PaymentSuccess] Procesando pago PAID:', {
    paymentId: payment.id,
    dLocalPaymentId: dLocalPaymentStatus.id,
    status: dLocalPaymentStatus.status
  });

  // Actualizar estado del pago
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('[PaymentSuccess] Error actualizando estado del pago:', updateError);
    return;
  }

  console.log('[PaymentSuccess] Estado del pago actualizado exitosamente');

  // Obtener información completa de la factura si no está incluida
  let invoice = payment.invoice;
  if (!invoice || !invoice.id) {
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('id, organization_id, type, total, currency, status')
      .eq('id', payment.invoice_id)
      .single();
    invoice = invoiceData;
  }

  // Actualizar factura si existe
  if (invoice) {
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    // Notificar pago exitoso
    try {
      await notifyPaymentSucceeded(
        orgId,
        invoice.total || dLocalPaymentStatus.amount,
        invoice.currency || dLocalPaymentStatus.currency,
        invoice.id
      );
    } catch (notifError: any) {
      console.error('[PaymentSuccess] Error enviando notificación de pago exitoso:', notifError);
    }

    // Si es compra de créditos, agregar créditos
    if (invoice.type === 'credit_purchase') {
      // Obtener cantidad de créditos desde metadata o invoice line items
      let creditsAmount = 0;

      if (payment.metadata?.credits_amount) {
        creditsAmount = parseFloat(payment.metadata.credits_amount.toString());
      } else {
        // Buscar en invoice line items
        const { data: lineItems } = await supabase
          .from('invoice_line_items')
          .select('description')
          .eq('invoice_id', invoice.id)
          .limit(1)
          .maybeSingle();

        if (lineItems?.description) {
          const creditsMatch = lineItems.description.match(/(\d+)\s*créditos/i);
          creditsAmount = creditsMatch ? parseFloat(creditsMatch[1]) : 0;
        }
      }

      if (creditsAmount > 0) {
        try {
          await addCredits(
            orgId,
            creditsAmount,
            'credit_purchase',
            {
              payment_id: payment.id,
              dlocal_payment_id: dLocalPaymentStatus.id,
              invoice_id: invoice.id,
            }
          );

          console.log('[PaymentSuccess] Créditos agregados exitosamente:', creditsAmount);

          // Notificar créditos agregados
          try {
            await notifyCreditsAdded(
              orgId,
              creditsAmount,
              'credit_purchase',
              invoice.id
            );
          } catch (notifError: any) {
            console.error('[PaymentSuccess] Error enviando notificación de créditos agregados:', notifError);
          }
        } catch (error: any) {
          console.error('[PaymentSuccess] Error agregando créditos:', error);
        }
      } else {
        console.warn('[PaymentSuccess] No se pudo determinar la cantidad de créditos para el pago:', dLocalPaymentStatus.id);
      }
    }
  }
}

interface PageProps {
  searchParams: Promise<{ 
    payment_intent?: string;
    dlocal_payment_id?: string;
    merchant_checkout_token?: string;
    order_id?: string;
  }>;
}

async function PaymentSuccessContent({ 
  paymentIntentId, 
  dlocalPaymentId,
  merchantCheckoutToken,
  orderId
}: { 
  paymentIntentId?: string;
  dlocalPaymentId?: string;
  merchantCheckoutToken?: string;
  orderId?: string;
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
    dlocalPaymentId,
    merchantCheckoutToken,
    orderId,
    orgId: orgUser.organization_id,
    userId: user.id 
  });
  console.log('[PaymentSuccess] ====================================');

  let payment = null;

  if (paymentIntentId) {
    // Pago de Stripe
    const { data, error } = await supabase
      .from('payments') // Usar vista pública
      .select(`
        *,
        invoice:invoices (
          invoice_number,
          total,
          currency
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
  } else if (merchantCheckoutToken || orderId || dlocalPaymentId) {
    // Pago de dLocal
    // Prioridad 1: Buscar por merchant_checkout_token (más confiable)
    if (merchantCheckoutToken) {
      console.log('[PaymentSuccess] Buscando pago por merchant_checkout_token:', merchantCheckoutToken);
      // Buscar pagos de dLocal para esta organización y filtrar por metadata
      const { data: allPayments, error: fetchError } = await supabase
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
        .eq('provider', 'dlocal')
        .eq('organization_id', orgUser.organization_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (fetchError) {
        console.error('[PaymentSuccess] Error buscando pagos por merchant_checkout_token:', fetchError);
      } else {
        // Filtrar por merchant_checkout_token en metadata
        const matchingPayment = allPayments?.find(
          (p: any) => p.metadata?.merchant_checkout_token === merchantCheckoutToken
        );
        
        if (matchingPayment) {
          console.log('[PaymentSuccess] Pago encontrado por merchant_checkout_token:', matchingPayment.id);
          payment = matchingPayment;
        } else {
          console.warn('[PaymentSuccess] No se encontró pago con merchant_checkout_token:', merchantCheckoutToken);
        }
      }
      
      if (error) {
        console.error('[PaymentSuccess] Error buscando pago por merchant_checkout_token:', error);
      } else if (data) {
        console.log('[PaymentSuccess] Pago encontrado por merchant_checkout_token:', data.id);
        payment = data;
      } else {
        console.warn('[PaymentSuccess] No se encontró pago con merchant_checkout_token:', merchantCheckoutToken);
      }
    }
    
    // Prioridad 2: Buscar por order_id (invoice.id)
    if (!payment && orderId) {
      console.log('[PaymentSuccess] Buscando pago por order_id (invoice.id):', {
        orderId,
        orgId: orgUser.organization_id
      });
      
      // Primero verificar que la factura existe
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, organization_id, type, total, currency, invoice_number')
        .eq('id', orderId)
        .eq('organization_id', orgUser.organization_id)
        .maybeSingle();
      
      if (invoiceError) {
        console.error('[PaymentSuccess] Error buscando factura por order_id:', invoiceError);
      } else if (invoiceData) {
        console.log('[PaymentSuccess] Factura encontrada:', {
          invoiceId: invoiceData.id,
          invoiceNumber: invoiceData.invoice_number,
          type: invoiceData.type
        });
        
        // Ahora buscar el pago asociado a esta factura
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
          .eq('provider', 'dlocal')
          .eq('invoice_id', orderId)
          .eq('organization_id', orgUser.organization_id)
          .maybeSingle();
        
        if (error) {
          console.error('[PaymentSuccess] Error buscando pago por order_id:', error);
        } else if (data) {
          console.log('[PaymentSuccess] Pago encontrado por order_id:', {
            paymentId: data.id,
            status: data.status,
            providerPaymentId: data.provider_payment_id
          });
          payment = data;
        } else {
          console.warn('[PaymentSuccess] No se encontró pago con order_id, buscando pagos recientes...');
          
          // Fallback: buscar pagos recientes de dLocal para esta organización
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
          const { data: recentPayments } = await supabase
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
            .eq('organization_id', orgUser.organization_id)
            .eq('provider', 'dlocal')
            .gte('created_at', twoHoursAgo)
            .order('created_at', { ascending: false })
            .limit(5);
          
          console.log('[PaymentSuccess] Pagos recientes encontrados:', recentPayments?.length || 0);
          
          // Buscar el pago que coincida con el invoice_id
          const matchingPayment = recentPayments?.find((p: any) => p.invoice_id === orderId);
          if (matchingPayment) {
            console.log('[PaymentSuccess] Pago encontrado en pagos recientes:', matchingPayment.id);
            payment = matchingPayment;
          }
        }
      } else {
        console.warn('[PaymentSuccess] No se encontró factura con order_id:', orderId);
      }
    }
    
    // Prioridad 3: Si el payment_id viene como placeholder literal, buscar el pago más reciente
    if (!payment && dlocalPaymentId === '{payment_id}') {
      console.log('[PaymentSuccess] Placeholder detectado, buscando pago más reciente...');
      
      // Buscar el pago más reciente de dLocal para esta organización
      // Usar una ventana de tiempo más amplia (últimas 2 horas) para mayor flexibilidad
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      console.log('[PaymentSuccess] Buscando pagos desde:', twoHoursAgo);
      
      const { data: recentPayment, error } = await supabase
        .from('payments') // Usar vista pública
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            total,
            currency
          )
        `)
        .eq('organization_id', orgUser.organization_id)
        .eq('provider', 'dlocal')
        .gte('created_at', twoHoursAgo)
        .in('status', ['pending', 'succeeded'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('[PaymentSuccess] Error buscando pago dLocal:', error);
      } else if (!recentPayment) {
        console.warn('[PaymentSuccess] No se encontró ningún pago dLocal reciente para org:', orgUser.organization_id);
        // Intentar buscar sin filtro de tiempo para debug
        const { data: allPayments } = await supabase
          .from('payments')
          .select('id, provider_payment_id, status, created_at')
          .eq('organization_id', orgUser.organization_id)
          .eq('provider', 'dlocal')
          .order('created_at', { ascending: false })
          .limit(5);
        console.log('[PaymentSuccess] Últimos 5 pagos dLocal encontrados:', allPayments);
      } else {
        console.log('[PaymentSuccess] Pago dLocal encontrado:', {
          id: recentPayment.id,
          provider_payment_id: recentPayment.provider_payment_id,
          status: recentPayment.status,
          created_at: recentPayment.created_at
        });
      }
      
      // Si encontramos un pago, intentar consultar la API de dLocal para obtener estado actualizado
      if (recentPayment?.provider_payment_id) {
        try {
          console.log('[PaymentSuccess] Consultando API de dLocal para payment_id:', recentPayment.provider_payment_id);
          const dLocalPaymentStatus = await getPaymentStatus(recentPayment.provider_payment_id);
          console.log('[PaymentSuccess] Estado en dLocal:', dLocalPaymentStatus.status);
          
          // Si el pago está PAID en dLocal pero aún está pending en nuestra BD, actualizar y procesar créditos
          if (dLocalPaymentStatus.status === 'PAID' && recentPayment.status === 'pending') {
            await processPaidPayment(recentPayment, dLocalPaymentStatus, supabase, orgUser.organization_id);
            recentPayment.status = 'succeeded';
          }
        } catch (apiError) {
          console.error('[PaymentSuccess] Error consultando API de dLocal:', apiError);
          // Continuar con el pago encontrado en BD aunque falle la consulta a la API
        }
      }
      
      payment = recentPayment;
    } else {
      // Buscar por el payment_id real
      console.log('[PaymentSuccess] Buscando pago por payment_id real:', dlocalPaymentId);
      const { data, error } = await supabase
        .from('payments') // Usar vista pública
        .select(`
          *,
          invoice:invoices (
            invoice_number,
            total,
            currency
          )
        `)
        .eq('provider_payment_id', dlocalPaymentId)
        .eq('provider', 'dlocal')
        .maybeSingle();
      
      if (error) {
        console.error('[PaymentSuccess] Error buscando pago dLocal por ID:', error);
      } else if (!data) {
        console.warn('[PaymentSuccess] No se encontró pago con payment_id:', dlocalPaymentId);
      } else {
        console.log('[PaymentSuccess] Pago encontrado por ID:', data.id);
      }
      payment = data;
      
      // Si encontramos el pago por ID, verificar estado en dLocal Go
      if (payment?.provider_payment_id) {
        try {
          console.log('[PaymentSuccess] Consultando API de dLocal para payment_id:', payment.provider_payment_id);
          const dLocalPaymentStatus = await getPaymentStatus(payment.provider_payment_id);
          console.log('[PaymentSuccess] Estado en dLocal:', dLocalPaymentStatus.status);
          
          // Si el pago está PAID en dLocal pero aún está pending en nuestra BD, actualizar y procesar créditos
          if (dLocalPaymentStatus.status === 'PAID' && payment.status === 'pending') {
            await processPaidPayment(payment, dLocalPaymentStatus, supabase, orgUser.organization_id);
            payment.status = 'succeeded';
          }
        } catch (apiError) {
          console.error('[PaymentSuccess] Error consultando API de dLocal:', apiError);
        }
      }
    }
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
    
    // Si el pago está pending, verificar estado en dLocal Go
    if (payment.status === 'pending' && payment.provider_payment_id) {
      try {
        console.log('[PaymentSuccess] Pago está pending, verificando estado en dLocal Go...');
        const dLocalPaymentStatus = await getPaymentStatus(payment.provider_payment_id);
        console.log('[PaymentSuccess] Estado en dLocal Go:', dLocalPaymentStatus.status);
        
        // Si el pago está PAID en dLocal pero aún está pending en nuestra BD, actualizar y procesar créditos
        if (dLocalPaymentStatus.status === 'PAID') {
          console.log('[PaymentSuccess] Pago está PAID en dLocal Go, procesando...');
          await processPaidPayment(payment, dLocalPaymentStatus, supabase, orgUser.organization_id);
          payment.status = 'succeeded';
          payment.processed_at = new Date().toISOString();
        }
      } catch (apiError) {
        console.error('[PaymentSuccess] Error consultando API de dLocal:', apiError);
      }
    }
    
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
                dlocal_payment_id: payment.provider_payment_id,
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
                  dlocal_payment_id: payment.provider_payment_id,
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
  const dlocalPaymentId = params.dlocal_payment_id;
  const merchantCheckoutToken = params.merchant_checkout_token;
  const orderId = params.order_id;
  
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
          dlocalPaymentId={dlocalPaymentId}
          merchantCheckoutToken={merchantCheckoutToken}
          orderId={orderId}
        />
      </Suspense>
    </div>
  );
}

