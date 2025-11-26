import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { getPaymentStatus } from '@/lib/dlocal/client';

interface PageProps {
  searchParams: Promise<{ 
    payment_intent?: string;
    dlocal_payment_id?: string;
  }>;
}

async function PaymentSuccessContent({ 
  paymentIntentId, 
  dlocalPaymentId 
}: { 
  paymentIntentId?: string;
  dlocalPaymentId?: string;
}) {
  const supabase = await createClient();
  
  // Obtener usuario y organización
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
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
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
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

  let payment = null;

  if (paymentIntentId) {
    // Pago de Stripe
    const { data } = await supabase
      .schema('billing')
      .from('payments')
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
      .single();
    payment = data;
  } else if (dlocalPaymentId) {
    // Pago de dLocal
    // Si el payment_id viene como placeholder literal, buscar el pago más reciente
    if (dlocalPaymentId === '{payment_id}') {
      // Buscar el pago más reciente de dLocal para esta organización
      // Usar una ventana de tiempo más amplia (últimas 2 horas) para mayor flexibilidad
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentPayment, error } = await supabase
        .schema('billing')
        .from('payments')
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
        .maybeSingle(); // Usar maybeSingle() para evitar errores
      
      if (error) {
        console.error('Error buscando pago dLocal:', error);
      }
      
      // Si encontramos un pago, intentar consultar la API de dLocal para obtener estado actualizado
      if (recentPayment?.provider_payment_id) {
        try {
          const dLocalPaymentStatus = await getPaymentStatus(recentPayment.provider_payment_id);
          
          // Si el pago está PAID en dLocal pero aún está pending en nuestra BD, actualizar
          if (dLocalPaymentStatus.status === 'PAID' && recentPayment.status === 'pending') {
            // Actualizar estado en nuestra BD
            await supabase
              .schema('billing')
              .from('payments')
              .update({
                status: 'succeeded',
                processed_at: new Date().toISOString(),
              })
              .eq('id', recentPayment.id);
            
            recentPayment.status = 'succeeded';
          }
        } catch (apiError) {
          console.error('Error consultando API de dLocal:', apiError);
          // Continuar con el pago encontrado en BD aunque falle la consulta a la API
        }
      }
      
      payment = recentPayment;
    } else {
      // Buscar por el payment_id real
      const { data, error } = await supabase
        .schema('billing')
        .from('payments')
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
        .maybeSingle(); // Usar maybeSingle() para evitar errores
      
      if (error) {
        console.error('Error buscando pago dLocal por ID:', error);
      }
      payment = data;
    }
  }

  if (!payment) {
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
        />
      </Suspense>
    </div>
  );
}

