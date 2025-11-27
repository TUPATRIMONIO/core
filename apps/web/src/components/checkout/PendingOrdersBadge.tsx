'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, XCircle, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PendingOrder {
  id: string;
  order_number: string;
  amount: number;
  currency: string;
  product_type: string;
  product_data: {
    name?: string;
    description?: string;
  };
  created_at: string;
  expires_at: string | null;
}

export function PendingOrdersBadge() {
  const router = useRouter();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Función para cargar órdenes pendientes
  const fetchPendingOrders = async () => {
    try {
      const response = await fetch('/api/checkout/pending');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y hacer polling cada 30 segundos
  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleContinuePayment = (orderId: string) => {
    router.push(`/checkout/${orderId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      const response = await fetch(`/api/checkout/${orderId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error cancelando orden');
      }

      toast.success('Orden cancelada correctamente');
      // Actualizar lista
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Error al cancelar la orden');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProductLabel = (productType: string, productData: any) => {
    if (productData?.name) return productData.name;
    
    // Mapeo de tipos de producto a nombres legibles
    const labels: Record<string, string> = {
      'credits': 'Créditos',
      'electronic_signature': 'Firma Electrónica',
      'notary_service': 'Servicio Notarial',
      'company_modification': 'Modificación de Empresa',
      'advisory': 'Asesoría',
      'subscription': 'Suscripción',
    };
    
    return labels[productType] || productType;
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  // Si no hay órdenes, mostrar ícono sin badge
  if (orders.length === 0) {
    return (
      <Button variant="ghost" size="icon" disabled className="relative opacity-50">
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {orders.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel>
          Órdenes Pendientes ({orders.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[400px] overflow-y-auto">
          {orders.map((order) => (
            <div key={order.id} className="p-3 border-b last:border-b-0 hover:bg-muted/50">
              <div className="space-y-2">
                {/* Header con número de orden */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {getProductLabel(order.product_type, order.product_data)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.order_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCurrency(order.amount, order.currency)}
                    </p>
                  </div>
                </div>

                {/* Fecha de creación */}
                <p className="text-xs text-muted-foreground">
                  Creada: {formatDate(order.created_at)}
                </p>

                {/* Advertencia de expiración si aplica */}
                {order.expires_at && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Expira: {formatDate(order.expires_at)}
                  </p>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleContinuePayment(order.id)}
                    className="flex-1 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Continuar Pago
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingOrderId === order.id}
                  >
                    {cancellingOrderId === order.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

