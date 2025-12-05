import { getOrder, canPayOrder, isOrderExpired } from '@/lib/checkout/core';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle, AlertCircle, FileText, Download, RefreshCcw, Ban, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import OrderCheckoutForm from '@/components/checkout/OrderCheckoutForm';
import OrderTimeline from '@/components/checkout/OrderTimeline';
import { isTransbankAvailable } from '@/lib/payments/availability';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

// Helper para obtener el badge de estado
function getStatusBadge(status: string, expired: boolean) {
  if (expired) {
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
      
      {/* Estado expirada */}
      {expired && (
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
              
              {order.expires_at && canPay && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-2 border-t">
                  <Clock className="h-3 w-3" />
                  <span>Expira: {new Date(order.expires_at).toLocaleString('es-CL')}</span>
                </div>
              )}
            </CardContent>
          </Card>
          
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
                  
                  {/* Placeholder: Solicitar reembolso (futuro) */}
                  {isCompleted && order.status === 'completed' && (
                    <Button variant="ghost" size="sm" disabled className="opacity-50">
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Solicitar Reembolso
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
            // Formulario de pago
            transbankAvailable ? (
              <Tabs defaultValue="transbank" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transbank">Transbank</TabsTrigger>
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                </TabsList>
                <TabsContent value="transbank" className="mt-3">
                  <OrderCheckoutForm
                    orderId={orderId}
                    order={order}
                    provider="transbank"
                    countryCode={countryCode}
                  />
                </TabsContent>
                <TabsContent value="stripe" className="mt-3">
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
