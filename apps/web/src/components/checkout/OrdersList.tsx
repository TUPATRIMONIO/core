'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Clock, ArrowRight, CheckCircle2, XCircle, FileText, CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/hooks/useOrganization';
import type { Order, OrderStatus } from '@/lib/checkout/core';

interface OrdersListProps {
  status?: OrderStatus | 'all';
}

interface OrderWithRelations extends Order {
  document?: {
    id: string;
    document_number: string;
    document_type: string;
    pdf_url: string | null;
    xml_url: string | null;
    status: string;
  } | null;
  payment?: {
    id: string;
    status: string;
    provider: string;
    amount: number;
    currency: string;
  } | null;
}

const getStatusBadge = (status: OrderStatus) => {
  const variants: Record<OrderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
    pending_payment: {
      variant: 'secondary',
      label: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    },
    paid: {
      variant: 'default',
      label: 'Pagada',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    },
    completed: {
      variant: 'default',
      label: 'Completada',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    },
    cancelled: {
      variant: 'destructive',
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    },
    refunded: {
      variant: 'outline',
      label: 'Reembolsada',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  };

  const config = variants[status];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

const getEmptyStateMessage = (status: OrderStatus | 'all') => {
  const messages: Record<string, string> = {
    all: 'No tienes órdenes registradas',
    pending_payment: 'No tienes órdenes pendientes de pago',
    paid: 'No tienes órdenes pagadas',
    completed: 'No tienes órdenes completadas',
    cancelled: 'No tienes órdenes canceladas',
    refunded: 'No tienes órdenes reembolsadas'
  };

  return messages[status] || messages.all;
};

export default function OrdersList({ status = 'all' }: OrdersListProps) {
  const { activeOrganization, isLoading: orgLoading } = useOrganization();
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (showLoading = true) => {
    // Esperar a que se cargue la organización activa
    if (!activeOrganization) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      
      // Construir URL con filtro de organización
      let url = `/api/checkout/orders?organizationId=${activeOrganization.id}`;
      if (status !== 'all') {
        url += `&status=${status}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo órdenes');
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  }, [status, activeOrganization]);

  // Carga inicial
  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Polling: verificar cada 5 segundos si hay órdenes completadas sin documento
  useEffect(() => {
    const hasOrdersWaitingForDocument = orders.some(
      order => order.status === 'completed' && (order.amount || 0) > 0 && !order.document?.pdf_url
    );

    if (!hasOrdersWaitingForDocument) return;

    const interval = setInterval(() => {
      fetchOrders(false); // Sin mostrar loading para no molestar
    }, 5000);

    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  if (loading || orgLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {getEmptyStateMessage(status)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const productData = order.product_data as any;
        const expiresAt = order.expires_at ? new Date(order.expires_at) : null;
        const isExpired = expiresAt && expiresAt < new Date();
        const isExpiringSoon = expiresAt && !isExpired && expiresAt.getTime() - Date.now() < 3600000; // Menos de 1 hora
        const canPay = order.status === 'pending_payment' && !isExpired && !isExpiringSoon;
        
        // Un documento solo se genera si el monto es > 0
        const isWaitingForDocument = order.status === 'completed' && (order.amount || 0) > 0 && !order.document?.pdf_url;
        
        // Si ha pasado más de 3 minutos desde que se completó y no hay documento, es probable que haya fallado
        const completedAt = order.completed_at ? new Date(order.completed_at) : null;
        const documentFailed = isWaitingForDocument && completedAt && (Date.now() - completedAt.getTime() > 180000); // 3 minutos

        return (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    {productData.name || `Producto ${order.product_type}`}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Orden #{order.order_number}
                  </CardDescription>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.product_type === 'credits' && productData.credits_amount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Créditos</span>
                    <span className="font-semibold">
                      {productData.credits_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-[var(--tp-buttons)]">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(order.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fecha de creación</span>
                  <span>
                    {new Date(order.created_at).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {expiresAt && order.status === 'pending_payment' && (
                  <div className={`flex items-center gap-2 text-sm ${isExpiringSoon || isExpired ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    <Clock className="h-4 w-4" />
                    <span>
                      {isExpired ? 'Expiró el: ' : isExpiringSoon ? 'Expira pronto: ' : 'Expira: '}
                      {expiresAt.toLocaleString('es-CL')}
                    </span>
                  </div>
                )}

                {order.status === 'paid' && order.completed_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>
                      Completada: {new Date(order.completed_at).toLocaleString('es-CL')}
                    </span>
                  </div>
                )}

                {order.status === 'cancelled' && order.cancelled_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span>
                      Cancelada: {new Date(order.cancelled_at).toLocaleString('es-CL')}
                    </span>
                  </div>
                )}

                {order.document && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>
                      Documento: {order.document.document_number}
                    </span>
                  </div>
                )}

                {/* Indicador de generación de invoice */}
                {isWaitingForDocument && !documentFailed && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generando invoice...</span>
                  </div>
                )}

                {documentFailed && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Documento en proceso o requiere revisión manual</span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  {order.status === 'pending_payment' && canPay && (
                    <Button asChild className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                      <Link href={`/checkout/${order.id}`}>
                        Continuar con el pago
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  
                  {order.status === 'pending_payment' && !canPay && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Esta orden ha expirado o no puede ser pagada
                    </div>
                  )}

                  {(order.status === 'paid' || order.status === 'completed') && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {order.document?.pdf_url ? (
                        <Button variant="outline" asChild className="flex-1">
                          <a 
                            href={order.document.pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer nofollow"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {order.document.document_type === 'boleta_electronica' 
                              ? 'Ver Boleta' 
                              : order.document.document_type === 'factura_electronica'
                                ? 'Ver Factura'
                                : 'Ver Invoice'}
                          </a>
                        </Button>
                      ) : isWaitingForDocument && !documentFailed ? (
                        <Button variant="outline" disabled className="flex-1">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando documento...
                        </Button>
                      ) : null}
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/checkout/${order.id}`}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/checkout/${order.id}`}>
                        Ver Detalles
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}

                  {order.status === 'refunded' && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Esta orden fue reembolsada
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
