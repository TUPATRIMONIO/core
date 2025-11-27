'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Clock, ArrowRight, CheckCircle2, XCircle, FileText, CreditCard } from 'lucide-react';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/lib/checkout/core';

interface OrdersListProps {
  status?: OrderStatus | 'all';
}

interface OrderWithRelations extends Order {
  invoice?: {
    id: string;
    invoice_number: string;
    total: number;
    currency: string;
    type: string;
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
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const url = status === 'all' 
          ? '/api/checkout/orders'
          : `/api/checkout/orders?status=${status}`;
        
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
    }

    fetchOrders();
  }, [status]);

  if (loading) {
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
        const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 3600000; // Menos de 1 hora
        const canPay = order.status === 'pending_payment' && !isExpiringSoon && expiresAt && expiresAt > new Date();

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
                  <div className={`flex items-center gap-2 text-sm ${isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    <Clock className="h-4 w-4" />
                    <span>
                      {isExpiringSoon ? 'Expira pronto: ' : 'Expira: '}
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

                {order.invoice && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>
                      Factura: {order.invoice.invoice_number}
                    </span>
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
                      {order.invoice && (
                        <Button variant="outline" asChild className="flex-1">
                          <Link href={`/billing/invoices/${order.invoice.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Factura
                          </Link>
                        </Button>
                      )}
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

