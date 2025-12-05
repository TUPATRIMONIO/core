import { getOrder, canPayOrder, isOrderExpired } from '@/lib/checkout/core';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Package, Clock, XCircle, CheckCircle2, History, FileText } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import OrderCheckoutForm from '@/components/checkout/OrderCheckoutForm';
import OrderTimeline from '@/components/checkout/OrderTimeline';
import { isTransbankAvailable } from '@/lib/payments/availability';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CheckoutOrderPage({ params }: PageProps) {
  const { orderId } = await params;
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
  
  // Obtener organización para determinar país
  const { data: org } = await supabase
    .from('organizations')
    .select('country')
    .eq('id', order.organization_id)
    .single();
  
  if (!org) {
    notFound();
  }
  
  const countryCode = org.country || 'US';
  const canPay = canPayOrder(order);
  const expired = isOrderExpired(order);
  
  // Verificar disponibilidad de Transbank (B2B Chile CLP)
  const transbankAvailable = await isTransbankAvailable(order.organization_id);
  
  // Obtener datos del producto
  const productData = order.product_data as any;
  
  // Calcular impuesto para mostrar en resumen
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = order.amount * (taxRate || 0);
  const total = order.amount + tax;
  
  // Obtener historial de la orden
  const { data: historyData, error: historyError } = await supabase
    .from('order_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  
  // Enriquecer eventos con información de usuarios si es necesario
  const enrichedHistory = await Promise.all(
    (historyData || []).map(async (event) => {
      const enriched: any = { ...event };
      
      if (event.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('email, raw_user_meta_data')
          .eq('id', event.user_id)
          .single();
        
        if (userData) {
          enriched.user = {
            id: event.user_id,
            email: userData.email,
            name: userData.raw_user_meta_data?.name || userData.raw_user_meta_data?.full_name || null,
          };
        }
      }
      
      return enriched;
    })
  );
  
  // Obtener documento de facturación si la orden está completada
  let invoiceDocument = null;
  if (order.status === 'completed') {
    // Primero buscar documentos con status 'issued'
    const { data: document, error: docError } = await supabase
      .from('invoicing_documents')
      .select('id, document_number, document_type, pdf_url, xml_url, status, external_id')
      .eq('order_id', orderId)
      .eq('status', 'issued')
      .maybeSingle();
    
    if (document) {
      invoiceDocument = document;
    } else {
      // Si no hay documento con status 'issued', buscar cualquier documento para debugging
      const { data: anyDocument } = await supabase
        .from('invoicing_documents')
        .select('id, document_number, document_type, pdf_url, xml_url, status, external_id')
        .eq('order_id', orderId)
        .maybeSingle();
      
      if (anyDocument) {
        console.log('[CheckoutOrderPage] Documento encontrado con estado:', anyDocument.status);
        // Si el documento existe pero no está 'issued', aún así lo mostramos si tiene pdf_url
        if (anyDocument.pdf_url) {
          invoiceDocument = anyDocument;
        }
      } else {
        console.log('[CheckoutOrderPage] No se encontró documento para la orden:', orderId);
      }
    }
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Completar Compra</h1>
          <p className="text-muted-foreground mt-2">
            Orden #{order.order_number}
          </p>
        </div>
      </div>
      
      {/* Alertas de estado */}
      {!canPay && (
        <Alert variant={expired ? 'destructive' : 'default'}>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {expired 
              ? 'Esta orden ha expirado. Por favor crea una nueva orden.'
              : `Esta orden está en estado: ${order.status}. No puede ser pagada.`}
          </AlertDescription>
        </Alert>
      )}
      
      {order.status === 'paid' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Esta orden ya ha sido pagada. El producto está siendo procesado.
          </AlertDescription>
        </Alert>
      )}
      
      {order.status === 'completed' && (
        <>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Esta orden ha sido completada exitosamente.
            </AlertDescription>
          </Alert>
          {invoiceDocument?.pdf_url && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Tu documento tributario está listo</span>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={invoiceDocument.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer nofollow"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Invoice
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
      
      <Tabs defaultValue="checkout" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkout">Pago</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="checkout" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resumen de la orden */}
            <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Resumen de la Orden
              </CardTitle>
              <CardDescription>
                Orden #{order.order_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {productData.name || `Producto ${order.product_type}`}
                </h3>
                {productData.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {productData.description}
                  </p>
                )}
              </div>
              
              {order.product_type === 'credits' && productData.credits_amount && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Créditos</span>
                    <span className="font-semibold">
                      {productData.credits_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(order.amount)}
                  </span>
                </div>
                {tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Impuesto</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(tax)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold text-[var(--tp-buttons)]">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(total)}
                  </span>
                </div>
              </div>
              
              {order.expires_at && canPay && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expira: {new Date(order.expires_at).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Formulario de pago */}
        <div className="lg:col-span-2">
          {canPay ? (
            transbankAvailable ? (
              <Tabs defaultValue="transbank" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transbank">Transbank</TabsTrigger>
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                </TabsList>
                <TabsContent value="transbank" className="mt-4">
                  <OrderCheckoutForm
                    orderId={orderId}
                    order={order}
                    provider="transbank"
                    countryCode={countryCode}
                  />
                </TabsContent>
                <TabsContent value="stripe" className="mt-4">
                  <OrderCheckoutForm
                    orderId={orderId}
                    order={order}
                    provider="stripe"
                    countryCode={countryCode}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <OrderCheckoutForm
                orderId={orderId}
                order={order}
                provider="stripe"
                countryCode={countryCode}
              />
            )
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Esta orden no puede ser pagada en este momento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <OrderTimeline events={enrichedHistory || []} orderNumber={order.order_number} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

