import { getOrder, canPayOrder, isOrderExpired } from '@/lib/checkout/core';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle, AlertCircle, FileText, Download, RefreshCcw, Ban, CreditCard, PenTool, ChevronDown, ChevronUp, User, MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import OrderCheckoutForm from '@/components/checkout/OrderCheckoutForm';
import OrderTimeline from '@/components/checkout/OrderTimeline';
import { getPaymentConfig } from '@/lib/payments/availability';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientRefundModal } from '@/components/checkout/ClientRefundModal';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';

import ZeroAmountCheckoutForm from '@/components/checkout/ZeroAmountCheckoutForm';
import { OrderDetailsCollapsible } from '@/components/checkout/OrderDetailsCollapsible';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

// Helper para obtener el badge de estado
function getStatusBadge(status: string, expired: boolean) {
  // Solo mostrar "Expirada" si está pendiente de pago y expirada
  // Las órdenes completadas/pagadas nunca deben mostrar "Expirada"
  if (expired && status === 'pending_payment') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Expirada
      </Badge>
    );
  }
  
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    pending_payment: { 
      label: 'Pendiente', 
      variant: 'secondary',
      icon: <Clock className="h-3 w-3" />
    },
    paid: { 
      label: 'Pagada', 
      variant: 'default',
      icon: <CreditCard className="h-3 w-3" />
    },
    completed: { 
      label: 'Completada', 
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    cancelled: { 
      label: 'Cancelada', 
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3" />
    },
    refunded: { 
      label: 'Reembolsada', 
      variant: 'outline',
      icon: <AlertCircle className="h-3 w-3" />
    },
  };
  
  const config = statusConfig[status] || { label: status, variant: 'secondary', icon: null };
  
  return (
    <Badge 
      variant={config.variant} 
      className={`gap-1 ${status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

// Helper para obtener label del documento
function getDocumentLabel(documentType: string | null) {
  switch (documentType) {
    case 'boleta_electronica':
      return 'Ver Boleta';
    case 'factura_electronica':
      return 'Ver Factura';
    case 'stripe_invoice':
    default:
      return 'Ver Invoice';
  }
}

// Helper para obtener nombre amigable del proveedor de pago
function getPaymentProviderLabel(provider: string | null | undefined, metadata?: any): string {
  if (!provider) return 'No especificado';
  
  switch (provider) {
    case 'stripe':
      return 'Stripe';
    case 'transbank':
      // Determinar si es Webpay o Oneclick basándose en metadata
      if (metadata) {
        const meta = metadata as any;
        if (meta.payment_method === 'oneclick' || meta.store_commerce_code || meta.store_buy_order) {
          return 'Transbank Oneclick';
        } else if (meta.session_id || meta.buy_order) {
          return 'Transbank Webpay Plus';
        }
      }
      return 'Transbank';
    case 'transbank_webpay':
      return 'Transbank Webpay Plus';
    case 'transbank_oneclick':
      return 'Transbank Oneclick';
    default:
      return provider;
  }
}

// Helper para obtener label del destino de reembolso
function getRefundDestinationLabel(destination: string): string {
  switch (destination) {
    case 'payment_method':
      return 'Tarjeta original';
    case 'wallet':
      return 'Monedero digital (Créditos)';
    default:
      return destination;
  }
}

export default async function CheckoutOrderPage({ params }: PageProps) {
  const { orderId } = await params;
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Inicia sesión para continuar</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Ingresar</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm redirectTo={`/checkout/${orderId}`} />
              </TabsContent>
              <TabsContent value="register">
                <SignupForm redirectTo={`/checkout/${orderId}`} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Obtener orden con pago
  const order = await getOrder(orderId);
  
  if (!order) {
    notFound();
  }
  
  // Obtener pago asociado si existe
  let payment = null;
  if (order.payment_id) {
    const { data: paymentData } = await supabase
      .from('payments')
      .select('*')
      .eq('id', order.payment_id)
      .single();
    payment = paymentData;
  }
  
  // Verificar que la orden pertenece a la organización activa del usuario
  const { getUserActiveOrganization } = await import('@/lib/organization/utils');
  const { organization: activeOrg } = await getUserActiveOrganization(supabase);
  
  if (!activeOrg || activeOrg.id !== order.organization_id) {
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
  
  // Obtener configuración de pagos disponible
  const paymentConfig = await getPaymentConfig(order.organization_id);
  
  // Obtener datos de facturación de la organización (para cargar por defecto)
  const billingData = (org.settings as any)?.billing_data || null;
  
  // Solo considerar expirada si está pendiente de pago y la fecha pasó
  const expired = order.status === 'pending_payment' && isOrderExpired(order);
  const isZeroAmount = order.amount === 0;
  
  // Obtener datos del producto
  const productData = order.product_data as any;
  
  // Obtener historial de la orden
  const { data: historyData } = await supabase
    .from('order_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  
  // Enriquecer eventos con información de usuarios
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
  if (order.status === 'completed' || order.status === 'paid') {
    const { data: document } = await supabase
      .from('invoicing_documents')
      .select('id, document_number, document_type, pdf_url, xml_url, status, external_id')
      .eq('order_id', orderId)
      .maybeSingle();
    
    if (document?.pdf_url) {
      invoiceDocument = document;
    }
  }

  // Obtener reembolsos completados de la orden
  let refunds: any[] = [];
  if (order.status === 'refunded' || order.status === 'completed') {
    const { data: refundsData } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'completed')
      .order('processed_at', { ascending: false });
    
    refunds = refundsData || [];
  }

  // Obtener documento de firma asociado al pedido
  let signingDocument = null;
  const { data: signingDocData } = await supabase
    .from('signing_documents')
    .select('id, title, send_to_signers_on_complete')
    .eq('order_id', orderId)
    .maybeSingle();
  
  if (signingDocData?.id) {
    signingDocument = signingDocData;
  }

  // Obtener firmantes del documento de firma
  let signers: any[] = [];
  if (signingDocument?.id) {
    const { data: signersData } = await supabase
      .from('signing_signers')
      .select('email, full_name, rut, signing_order')
      .eq('document_id', signingDocument.id)
      .order('signing_order', { ascending: true });
    
    signers = signersData || [];
  }
  
  const isCompleted = order.status === 'completed' || order.status === 'paid';
  const isCancelled = order.status === 'cancelled';
  const isRefunded = order.status === 'refunded';
  
  return (
    <div className="container mx-auto py-4 px-4 max-w-4xl">
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 h-8 w-8">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold">Orden #{order.order_number}</h1>
            {getStatusBadge(order.status, expired)}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('es-CL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      {/* Estado prominente - Solo para completadas (visible primero en mobile) */}
      {isCompleted && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">¡Compra Exitosa!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {order.product_type === 'credits' 
                  ? `${productData.credits_amount?.toLocaleString() || ''} créditos agregados a tu cuenta`
                  : 'Tu compra ha sido procesada exitosamente'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Estado expirada - Solo para órdenes pendientes de pago */}
      {expired && order.status === 'pending_payment' && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full shrink-0">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-200">Orden Expirada</p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Esta orden ya no puede ser pagada
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/billing/purchase-credits">Nueva orden</Link>
            </Button>
          </div>
        </div>
      )}
      
      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Columna izquierda: Resumen */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumen del pedido */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <h3 className="font-semibold text-base">
                  {productData.name || `Producto ${order.product_type}`}
                </h3>
                {productData.description && (
                  <p className="text-xs text-muted-foreground">
                    {productData.description}
                  </p>
                )}
              </div>
              
              {order.product_type === 'credits' && productData.credits_amount && (
                <div className="flex items-center justify-between py-2 border-y text-sm">
                  <span className="text-muted-foreground">Créditos</span>
                  <span className="font-semibold text-[var(--tp-buttons)]">
                    {productData.credits_amount.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Total</span>
                <span className="text-lg font-bold text-[var(--tp-buttons)]">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: order.currency,
                  }).format(order.amount)}
                </span>
              </div>
              
              {/* Medio de pago usado - Mostrar siempre que haya un pago */}
              {payment && (
                <div className="flex items-center justify-between py-2 border-t text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Medio de pago
                  </span>
                  <span className="font-semibold">
                    {getPaymentProviderLabel(payment.provider, payment.metadata)}
                  </span>
                </div>
              )}
              
              {/* Información de reembolsos - Solo si hay reembolsos completados */}
              {refunds.length > 0 && (
                <div className="py-2 border-t space-y-2">
                  <div className="text-xs text-muted-foreground mb-1">Reembolsos realizados:</div>
                  {refunds.map((refund) => (
                    <div key={refund.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <RefreshCcw className="h-3 w-3" />
                        {getRefundDestinationLabel(refund.refund_destination)}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">
                          {new Intl.NumberFormat('es-CL', {
                            style: 'currency',
                            currency: refund.currency,
                          }).format(refund.amount)}
                        </span>
                        {refund.processed_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(refund.processed_at).toLocaleDateString('es-CL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {order.expires_at && canPay && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-2 border-t">
                  <Clock className="h-3 w-3" />
                  <span>Expira: {new Date(order.expires_at).toLocaleString('es-CL')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalles del pedido - Colapsable */}
          <OrderDetailsCollapsible
            productData={productData}
            productType={order.product_type}
            signers={signers}
            signingDocument={signingDocument}
            billingData={order.metadata?.billing_data || null}
            currency={order.currency}
          />
          
          {/* Acciones del pedido - Escalable para futuros botones */}
          {(isCompleted || isCancelled || isRefunded) && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {/* Documento tributario */}
                  {invoiceDocument?.pdf_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={invoiceDocument.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer nofollow"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {getDocumentLabel(invoiceDocument.document_type)}
                      </a>
                    </Button>
                  )}
                  
                  {/* XML (si existe) - Para empresas que necesitan el XML */}
                  {invoiceDocument?.xml_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={invoiceDocument.xml_url} 
                        target="_blank" 
                        rel="noopener noreferrer nofollow"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        XML
                      </a>
                    </Button>
                  )}
                  
                  {/* Solicitar reembolso */}
                  {isCompleted && order.status === 'completed' && payment && (
                    <ClientRefundModal
                      orderId={order.id}
                      orderAmount={order.amount}
                      orderCurrency={order.currency}
                      orderStatus={order.status}
                      hasPayment={!!payment}
                    />
                  )}
                  
                  {/* Administración del flujo de firmas */}
                  {signingDocument?.id && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/signing/documents/${signingDocument.id}`}>
                        <PenTool className="mr-2 h-4 w-4" />
                        Gestionar Firmas
                      </Link>
                    </Button>
                  )}
                  
                  {/* Placeholder: Anular (futuro) - solo visible para admin */}
                  {/* 
                  <Button variant="ghost" size="sm" disabled className="opacity-50 text-destructive">
                    <Ban className="mr-2 h-4 w-4" />
                    Anular
                  </Button>
                  */}
                </div>
                
                {/* Mensaje si no hay acciones disponibles */}
                {!invoiceDocument?.pdf_url && !isRefunded && (
                  <p className="text-xs text-muted-foreground">
                    No hay acciones disponibles para esta orden
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Columna derecha: Pago o Historial */}
        <div className="lg:col-span-3 space-y-4">
        {canPay ? (
          // Formulario de pago o confirmación gratuita
          isZeroAmount ? (
            <ZeroAmountCheckoutForm
              orderId={orderId}
              orderAmount={order.amount}
              orderCurrency={order.currency}
              countryCode={countryCode}
            />
          ) : (
            <OrderCheckoutForm
              orderId={orderId}
              order={order}
              paymentConfig={paymentConfig}
              defaultBillingData={billingData}
            />
          )
        ) : (
            // Historial (cuando no hay formulario de pago)
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Historial</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[350px] overflow-y-auto">
                  <OrderTimeline 
                    events={enrichedHistory || []} 
                    orderNumber={order.order_number}
                    compact
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Historial al final (solo si hay formulario de pago activo) */}
      {canPay && (
        <div className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Historial</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[200px] overflow-y-auto">
                <OrderTimeline 
                  events={enrichedHistory || []} 
                  orderNumber={order.order_number}
                  compact
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
