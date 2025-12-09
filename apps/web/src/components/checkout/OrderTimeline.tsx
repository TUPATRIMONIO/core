'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  CreditCard, 
  Package, 
  AlertCircle,
  Circle,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface OrderHistoryEvent {
  id: string;
  order_id: string;
  event_type: string;
  event_description: string;
  event_metadata: Record<string, any>;
  user_id?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

interface OrderTimelineProps {
  events: OrderHistoryEvent[];
  orderNumber?: string;
  compact?: boolean;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'order_created':
      return Package;
    case 'status_changed':
      return ArrowRight;
    case 'invoice_created':
      return FileText;
    case 'payment_initiated':
      return CreditCard;
    case 'payment_succeeded':
      return CheckCircle2;
    case 'payment_failed':
      return XCircle;
    case 'order_cancelled':
      return XCircle;
    case 'order_expired':
      return AlertCircle;
    case 'order_completed':
      return CheckCircle2;
    case 'order_refunded':
      return AlertCircle;
    case 'order_modified':
      return FileText;
    default:
      return Circle;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'order_created':
      return 'bg-[var(--tp-brand)] text-white';
    case 'status_changed':
      return 'bg-[var(--tp-buttons)] text-white';
    case 'invoice_created':
      return 'bg-blue-500 text-white';
    case 'payment_initiated':
      return 'bg-yellow-500 text-white';
    case 'payment_succeeded':
      return 'bg-[var(--tp-success)] text-white';
    case 'payment_failed':
      return 'bg-[var(--tp-error)] text-white';
    case 'order_cancelled':
      return 'bg-[var(--tp-error)] text-white';
    case 'order_expired':
      return 'bg-orange-500 text-white';
    case 'order_completed':
      return 'bg-[var(--tp-success)] text-white';
    case 'order_refunded':
      return 'bg-purple-500 text-white';
    case 'order_modified':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const getStatusBadgeVariant = (status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline';
  
  switch (status) {
    case 'pending_payment':
      return 'secondary';
    case 'paid':
      return 'default';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'refunded':
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status?: string | null): string => {
  if (!status) return '';
  
  const labels: Record<string, string> = {
    pending_payment: 'Pendiente de pago',
    paid: 'Pagada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    refunded: 'Reembolsada',
  };
  
  return labels[status] || status;
};

const formatEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} de ${month}, ${year} a las ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

export default function OrderTimeline({ events, orderNumber, compact = false }: OrderTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };
  
  // Formato de fecha compacto
  const formatCompactDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Función para deduplicar eventos por cambio de estado
  const deduplicateByStatus = (eventsList: OrderHistoryEvent[]): OrderHistoryEvent[] => {
    const seen = new Map<string, OrderHistoryEvent>();
    
    // Ordenar por fecha descendente para mantener el más reciente
    const sorted = [...eventsList].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    for (const event of sorted) {
      // Caso especial: Si hay order_completed con "Pedido completado exitosamente",
      // eliminar cualquier status_changed con to_status = 'completed'
      if (event.event_type === 'status_changed' && event.to_status === 'completed') {
        const hasOrderCompleted = eventsList.some(e => 
          e.event_type === 'order_completed' && 
          e.event_description === 'Pedido completado exitosamente'
        );
        if (hasOrderCompleted) {
          continue; // Saltar este evento duplicado
        }
      }
      
      // Caso especial: Si hay múltiples "Pago confirmado" (status_changed a 'paid'),
      // mantener solo el más reciente
      if (event.event_type === 'status_changed' && 
          event.to_status === 'paid' && 
          event.event_description === 'Pago confirmado') {
        const paidKey = `${event.order_id}-paid-confirmed`;
        if (!seen.has(paidKey)) {
          seen.set(paidKey, event);
        }
        continue; // Ya procesado, saltar al siguiente
      }
      
      // Crear clave única para cambios de estado
      if (event.from_status && event.to_status) {
        const statusKey = `${event.order_id}-${event.from_status}-${event.to_status}`;
        
        // Si ya existe un evento para este cambio de estado, mantener solo el más reciente
        if (!seen.has(statusKey)) {
          seen.set(statusKey, event);
        }
      } else {
        // Para eventos sin cambio de estado (order_created, order_completed sin status_changed, etc.),
        // usar tipo de evento como clave para evitar duplicados del mismo tipo
        const typeKey = `${event.order_id}-${event.event_type}`;
        if (!seen.has(typeKey)) {
          seen.set(typeKey, event);
        }
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  // Filtrar eventos técnicos y duplicados
  const relevantEvents = (events || []).filter(event => {
    // 1. Filtrar por tipo de evento técnico
    const hiddenEventTypes = [
      'invoice_created',      // Detalle técnico
      'payment_initiated',    // Detalle técnico
      'order_modified',       // Muy técnico
    ];
    
    if (hiddenEventTypes.includes(event.event_type)) {
      return false;
    }
    
    // 2. Filtrar por descripción técnica o duplicada
    const description = event.event_description || '';
    
    if (
      description.includes('Pago exitoso vía') ||
      description.includes('Factura creada') ||
      description.includes('Pago iniciado') ||
      description === 'Estado actualizado con información adicional' ||
      description.startsWith('Estado cambiado de') || // Descripciones técnicas antiguas
      (description === 'Pedido completado' && event.event_type === 'status_changed') // Duplicado de order_completed
    ) {
      return false;
    }
    
    return true;
  });

  // Deduplicar eventos por cambio de estado
  const deduplicatedEvents = deduplicateByStatus(relevantEvents);

  if (!deduplicatedEvents || deduplicatedEvents.length === 0) {
    if (compact) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No hay eventos registrados
        </div>
      );
    }
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay eventos registrados para esta orden</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modo compacto
  if (compact) {
    return (
      <div className="divide-y divide-[var(--tp-lines-20)]">
        {deduplicatedEvents.map((event) => {
          const Icon = getEventIcon(event.event_type);
          const iconColor = getEventColor(event.event_type);
          
          return (
            <div key={event.id} className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors">
              <div className={`${iconColor} rounded-full p-1.5 shrink-0`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {event.event_description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCompactDate(event.created_at)}
                </p>
              </div>
              {event.to_status && (
                <Badge variant={getStatusBadgeVariant(event.to_status)} className="text-[10px] shrink-0">
                  {getStatusLabel(event.to_status)}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de la Orden
        </CardTitle>
        {orderNumber && (
          <CardDescription>
            Orden #{orderNumber}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Línea vertical conectora */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--tp-lines-30)] hidden md:block" />
          
          <div className="space-y-6">
            {deduplicatedEvents.map((event, index) => {
              const Icon = getEventIcon(event.event_type);
              const iconColor = getEventColor(event.event_type);
              const isLast = index === deduplicatedEvents.length - 1;
              const isExpanded = expandedEvents.has(event.id);
              const hasMetadata = event.event_metadata && Object.keys(event.event_metadata).length > 0;

              return (
                <div key={event.id} className="relative flex gap-4 md:gap-6">
                  {/* Icono del evento */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`${iconColor} rounded-full p-2.5 shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-6 bg-[var(--tp-lines-30)] hidden md:block" />
                    )}
                  </div>

                  {/* Contenido del evento */}
                  <div className="flex-1 min-w-0 pb-6 md:pb-8">
                    <div className="bg-[var(--tp-background-light)] rounded-lg p-4 border border-[var(--tp-lines-30)]">
                      {/* Header del evento */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold text-sm md:text-base text-foreground">
                              {event.event_description}
                            </h4>
                            {event.to_status && (
                              <Badge variant={getStatusBadgeVariant(event.to_status)} className="text-xs">
                                {getStatusLabel(event.to_status)}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Información de fecha y usuario */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                            <span>{formatEventDate(event.created_at)}</span>
                            {event.user && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span>Por: {event.user.name || event.user.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metadata expandible - Solo mostrar si hay información relevante para el cliente */}
                      {hasMetadata && (
                        <div className="mt-3">
                          {/* Filtrar metadata técnica que no interesa al cliente */}
                          {(() => {
                            const clientRelevantMetadata = Object.entries(event.event_metadata).filter(([key]) => {
                              // Ocultar IDs técnicos y detalles internos
                              const hiddenKeys = [
                                'payment_id',
                                'payment_intent_id',
                                'invoice_id',
                                'order_number',
                                'previous_status',
                                'new_status',
                                'provider',
                                'checkout_session_id',
                                'authorization_code',
                                'transaction_date',
                                'buy_order',
                                'session_id',
                                'token',
                                'payment_type',
                              ];
                              return !hiddenKeys.includes(key);
                            });

                            // Solo mostrar si hay metadata relevante
                            if (clientRelevantMetadata.length === 0) {
                              return null;
                            }

                            return (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => toggleEvent(event.id)}
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Ocultar detalles
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      Ver detalles
                                    </>
                                  )}
                                </Button>
                                {isExpanded && (
                                  <div className="mt-2 bg-white dark:bg-[var(--tp-background-dark)] rounded-md p-3 border border-[var(--tp-lines-30)]">
                                    <dl className="space-y-2 text-xs">
                                      {clientRelevantMetadata.map(([key, value]) => (
                                        <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1">
                                          <dt className="font-medium text-muted-foreground min-w-[120px] capitalize">
                                            {key.replace(/_/g, ' ')}:
                                          </dt>
                                          <dd className="text-foreground break-all">
                                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                          </dd>
                                        </div>
                                      ))}
                                    </dl>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Cambio de estado - Solo mostrar si es relevante y no es redundante con la descripción */}
                      {event.from_status && event.to_status && event.event_type === 'status_changed' && (
                        <div className="mt-3 pt-3 border-t border-[var(--tp-lines-30)]">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getStatusLabel(event.from_status)}
                            </Badge>
                            <ArrowRight className="h-3 w-3" />
                            <Badge variant={getStatusBadgeVariant(event.to_status)} className="text-xs">
                              {getStatusLabel(event.to_status)}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

