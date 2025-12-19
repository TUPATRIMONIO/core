'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const pathname = usePathname();
  const { activeOrganization, isLoading: orgLoading } = useOrganization();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Verificar si estamos en una página de admin
  const isAdminPage = pathname?.startsWith('/admin');

  // Función para cargar órdenes pendientes (filtradas por org activa)
  const fetchPendingOrders = useCallback(async () => {
    // No hacer polling en páginas de admin
    if (isAdminPage) {
      setLoading(false);
      return;
    }

    // Esperar a que se cargue la organización activa
    if (!activeOrganization) {
      setLoading(false);
      return;
    }

    try {
      // Verificar autenticación antes de hacer la petición
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Limpiar interval si existe
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setLoading(false);
        return;
      }

      // Filtrar por la organización activa
      const response = await fetch(`/api/checkout/pending?organizationId=${activeOrganization.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else if (response.status === 401) {
        // Si recibimos 401, detener el polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdminPage, supabase, activeOrganization]);

  // Ya no necesitamos fetchUserOrganizations, usamos activeOrganization del contexto

  // Ref para mantener la org activa en el callback de Realtime
  const activeOrgIdRef = useRef<string | null>(null);

  // Configurar suscripción Realtime
  useEffect(() => {
    // No configurar nada si estamos en una página de admin
    if (isAdminPage) {
      // Limpiar cualquier intervalo o canal existente
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setLoading(false);
      setOrders([]);
      return;
    }

    let isMounted = true;

    const setupRealtime = async () => {
      // Verificar nuevamente si estamos en admin antes de continuar
      if (isAdminPage) {
        return;
      }

      // Esperar a que haya organización activa
      if (!activeOrganization) {
        return;
      }

      // Guardar org activa en el ref para uso en el callback de Realtime
      activeOrgIdRef.current = activeOrganization.id;

      // Cargar órdenes iniciales
      await fetchPendingOrders();

      // Configurar suscripción Realtime solo si no estamos en admin
      if (!isAdminPage) {
        // Nota: RLS de Supabase protegerá los datos, solo recibiremos órdenes de las organizaciones del usuario
        const channel = supabase
          .channel('pending-orders-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
            },
            (payload) => {
              if (!isMounted || isAdminPage) return;

              const updatedOrder = payload.new as any;
              const oldOrder = payload.old as any;

              // Verificar que la orden pertenece a la organización activa
              if (updatedOrder?.organization_id !== activeOrgIdRef.current) {
                return;
              }

              // Solo procesar si el status cambió de pending_payment a paid o cancelled
              if (
                oldOrder?.status === 'pending_payment' &&
                (updatedOrder?.status === 'paid' || updatedOrder?.status === 'cancelled')
              ) {
                // Remover la orden del estado local
                setOrders((currentOrders) =>
                  currentOrders.filter((order) => order.id !== updatedOrder.id)
                );

                // Mostrar notificación si fue pagada
                if (updatedOrder.status === 'paid') {
                  toast.success('Orden pagada exitosamente');
                }
              }
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              // Configurar polling como fallback si Realtime falla
              if (isMounted && !isAdminPage && !intervalRef.current) {
                intervalRef.current = setInterval(() => {
                  // Verificar nuevamente antes de cada ejecución
                  if (!isAdminPage) {
                    fetchPendingOrders();
                  }
                }, 60000);
              }
            }
          });

        channelRef.current = channel;

        // Configurar polling como respaldo (intervalo más largo ya que Realtime es principal)
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            // Verificar nuevamente antes de cada ejecución
            if (!isAdminPage) {
              fetchPendingOrders();
            }
          }, 60000); // 60 segundos
        }
      }
    };

    setupRealtime();

    // Escuchar eventos de actualización de órdenes para refrescar inmediatamente (compatibilidad)
    const handleOrderUpdate = () => {
      if (!isAdminPage) {
        fetchPendingOrders();
      }
    };

    window.addEventListener('order:status-updated', handleOrderUpdate);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      window.removeEventListener('order:status-updated', handleOrderUpdate);
    };
  }, [isAdminPage, fetchPendingOrders, supabase, activeOrganization]);

  const handleContinuePayment = (orderId: string) => {
    router.push(`/checkout/${orderId}`);
  };

  // Verificar estado de órdenes en el carrito al abrirlo
  const verifyOrdersStatus = async () => {
    if (orders.length === 0) return;

    try {
      // Obtener el estado actual de las órdenes desde la BD
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener IDs de las órdenes actuales en el carrito
      const orderIds = orders.map(order => order.id);

      // Consultar estado actual de estas órdenes
      const { data: currentOrders, error } = await supabase
        .from('orders')
        .select('id, status')
        .in('id', orderIds);

      if (error) {
        console.error('[PendingOrdersBadge] Error verificando estado de órdenes:', error);
        return;
      }

      if (!currentOrders || currentOrders.length === 0) {
        // Todas las órdenes fueron eliminadas o no se encontraron
        setOrders([]);
        return;
      }

      // Filtrar órdenes que ya no están en pending_payment
      const paidOrCancelledOrders = currentOrders.filter(
        order => order.status !== 'pending_payment'
      );

      if (paidOrCancelledOrders.length > 0) {
        console.log('[PendingOrdersBadge] Órdenes encontradas que ya no están pendientes:', paidOrCancelledOrders);
        
        // Remover órdenes pagadas o canceladas del estado local
        setOrders((currentOrdersState) =>
          currentOrdersState.filter(
            order => !paidOrCancelledOrders.some(po => po.id === order.id)
          )
        );

        // Mostrar notificación si alguna fue pagada
        const paidOrders = paidOrCancelledOrders.filter(o => o.status === 'paid');
        if (paidOrders.length > 0) {
          toast.success(
            paidOrders.length === 1
              ? 'Orden pagada exitosamente'
              : `${paidOrders.length} órdenes pagadas exitosamente`
          );
        }
      }
    } catch (error) {
      console.error('[PendingOrdersBadge] Error en verifyOrdersStatus:', error);
    }
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

  // Si estamos en una página de admin, no mostrar nada
  if (isAdminPage) {
    return null;
  }

  // Mostrar loading mientras carga la organización o las órdenes
  if (loading || orgLoading) {
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
    <DropdownMenu onOpenChange={(open) => {
      // Cuando se abre el carrito, verificar estado de las órdenes
      if (open) {
        verifyOrdersStatus();
      }
    }}>
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

