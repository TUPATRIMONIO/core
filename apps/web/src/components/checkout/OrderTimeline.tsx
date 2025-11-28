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

export default function OrderTimeline({ events, orderNumber }: OrderTimelineProps) {
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

  if (!events || events.length === 0) {
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
            {events.map((event, index) => {
              const Icon = getEventIcon(event.event_type);
              const iconColor = getEventColor(event.event_type);
              const isLast = index === events.length - 1;
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

                      {/* Metadata expandible */}
                      {hasMetadata && (
                        <div className="mt-3">
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
                                {Object.entries(event.event_metadata).map(([key, value]) => (
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
                        </div>
                      )}

                      {/* Cambio de estado */}
                      {event.from_status && event.to_status && (
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

