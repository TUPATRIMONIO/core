import { getOrder, canPayOrder, isOrderExpired } from '@/lib/checkout/core';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle, FileText, Download, RefreshCcw, Ban, CreditCard, PenTool, ChevronDown, ChevronUp, User, MapPin, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
import { OrderStatusBadges } from '@/components/checkout/OrderStatusBadges';

// Forzar renderizado dinámico para evitar 404 con órdenes recién creadas
export const dynamic = 'force-dynamic';

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
  console.log('[CheckoutPage] Iniciando renderizado para orderId:', orderId);
  
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[CheckoutPage] Usuario autenticado:', !!user);
  
  if (!user) {
    console.log('[CheckoutPage] Usuario no autenticado, mostrando login');
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
  console.log('[CheckoutPage] Buscando orden...');
  const order = await getOrder(orderId);
  
  if (!order) {
    console.error('[CheckoutPage] Orden no encontrada en DB:', orderId);
    notFound();
  }
  console.log('[CheckoutPage] Orden encontrada:', order.id, 'Org:', order.organization_id);
  
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
  console.log('[CheckoutPage] Org activa del usuario:', activeOrg?.id);
  
  if (!activeOrg || activeOrg.id !== order.organization_id) {
    console.error('[CheckoutPage] Mismatch de organización. Activa:', activeOrg?.id, 'Orden:', order.organization_id);
    // Verificar si el usuario tiene acceso a esa organización aunque no sea la activa
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', order.organization_id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      console.error('[CheckoutPage] Usuario no tiene acceso a la organización de la orden');
      notFound();
    } else {
      console.log('[CheckoutPage] Usuario tiene acceso a la organización (aunque no es la activa)');
    }
  }
  
  // Obtener organización para determinar país
  const { data: org } = await supabase
    .from('organizations')
    .select('country, settings')
    .eq('id', order.organization_id)
    .single();
  
  if (!org) {
    console.error('[CheckoutPage] Organización no encontrada:', order.organization_id);
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
    .select('id, title, status, signers_count, signed_count, send_to_signers_on_complete')
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
            {expired && order.status === 'pending_payment' ? (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Expirada
              </Badge>
            ) : (
              <OrderStatusBadges 
                orderStatus={order.status} 
                signingDocument={signingDocument}
              />
            )}
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
      
      {/* Acciones del pedido - Diseño Premium */}
      {(isCompleted || isCancelled || isRefunded) && (
        <Card className="mb-6 border-none shadow-md bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--tp-buttons)]" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="space-y-2 max-w-xl">
                <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <div className="p-2 rounded-full bg-[var(--tp-bg-light-10)] text-[var(--tp-buttons)]">
                    <FileText className="h-5 w-5" />
                  </div>
                  Gestión del Documento
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {signingDocument?.id 
                    ? "Tu documento está listo para ser gestionado. Accede a los detalles para revisar el estado de las firmas o descargar copias."
                    : "Revisa los detalles de tu orden y descarga los documentos tributarios asociados."}
                </p>
              </div>
              
              {signingDocument?.id && (
                <Button 
                  size="lg" 
                  className="w-full md:w-auto shrink-0 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" 
                  asChild
                >
                  <Link href={`/dashboard/signing/documents/${signingDocument.id}`} className="flex items-center justify-center gap-2 px-6">
                    <span className="font-semibold">Ver Detalles del Documento</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            {(invoiceDocument?.pdf_url || invoiceDocument?.xml_url || (isCompleted && order.status === 'completed' && payment)) && (
              <>
                <Separator className="my-5 bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                    Documentos y Ayuda:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {invoiceDocument?.pdf_url && (
                      <Button variant="outline" size="sm" className="h-8 bg-white dark:bg-zinc-900" asChild>
                        <a 
                          href={invoiceDocument.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer nofollow"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{getDocumentLabel(invoiceDocument.document_type)}</span>
                        </a>
                      </Button>
                    )}
                    
                    {invoiceDocument?.xml_url && (
                      <Button variant="outline" size="sm" className="h-8 bg-white dark:bg-zinc-900" asChild>
                        <a 
                          href={invoiceDocument.xml_url} 
                          target="_blank" 
                          rel="noopener noreferrer nofollow"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>XML</span>
                        </a>
                      </Button>
                    )}
                    
                    {isCompleted && order.status === 'completed' && payment && (
                      <ClientRefundModal
                        orderId={order.id}
                        orderAmount={order.amount}
                        orderCurrency={order.currency}
                        orderStatus={order.status}
                        hasPayment={!!payment}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Contenido principal con pestañas */}
      <Tabs defaultValue={canPay ? "pago" : "detalles"} className="w-full">
        <TabsList className={`grid w-full ${canPay ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
          {canPay && (
            <TabsTrigger value="pago" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pago
            </TabsTrigger>
          )}
          <TabsTrigger value="detalles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial
            {enrichedHistory && enrichedHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {enrichedHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Pago */}
        {canPay && (
          <TabsContent value="pago" className="mt-0">
            {isZeroAmount ? (
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
            )}
          </TabsContent>
        )}
        
        {/* Pestaña de Detalles */}
        <TabsContent value="detalles" className="mt-0 space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Detalles del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <OrderDetailsCollapsible
                productData={productData}
                productType={order.product_type}
                signers={signers}
                signingDocument={signingDocument}
                billingData={order.metadata?.billing_data || null}
                currency={order.currency}
                hideCard
              />
            </CardContent>
          </Card>
          
          {/* Acciones del pedido (movido arriba) */}
        </TabsContent>
        
        {/* Pestaña de Historial */}
        <TabsContent value="historial" className="mt-0">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Historial del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {enrichedHistory && enrichedHistory.length > 0 ? (
                <div className="max-h-[450px] overflow-y-auto">
                  <OrderTimeline 
                    events={enrichedHistory} 
                    orderNumber={order.order_number}
                    compact
                  />
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No hay eventos en el historial todavía
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}