'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/lib/checkout/core';

interface OrderListProps {
  orgId?: string; // Opcional: si no se proporciona, se obtiene automáticamente
}

export default function OrderList({ orgId }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/checkout/pending');
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
  }, []);

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
              No tienes órdenes pendientes
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

        return (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {productData.name || `Producto ${order.product_type}`}
                  </CardTitle>
                  <CardDescription>
                    Orden #{order.order_number}
                  </CardDescription>
                </div>
                <Badge variant={isExpired || isExpiringSoon ? 'destructive' : 'secondary'}>
                  {isExpired ? 'Expirada' : order.status === 'pending_payment' ? 'Pendiente' : order.status}
                </Badge>
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

                {expiresAt && (
                  <div className={`flex items-center gap-2 text-sm ${isExpired || isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    <Clock className="h-4 w-4" />
                    <span>
                      {isExpired ? 'Expiró: ' : isExpiringSoon ? 'Expira pronto: ' : 'Expira: '}
                      {expiresAt.toLocaleString('es-CL')}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button asChild className="w-full">
                    <Link href={`/checkout/${order.id}`}>
                      Continuar con el pago
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

