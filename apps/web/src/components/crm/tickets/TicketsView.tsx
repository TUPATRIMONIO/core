'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Search, ChevronDown, ChevronUp, X, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { getLatestTickets, updateTicketStatus } from '@/app/actions/crm/tickets';
import { 
  RecordListView, 
  RecordKanbanView, 
  RecordsViewToggle,
  ColumnDefinition,
  RowAction,
  KanbanColumn
} from '@/components/shared';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to: string;
  owner_name?: string;
  description?: string;
}

interface TicketsViewProps {
  tickets: Ticket[];
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'new', label: 'Nuevo', color: 'bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800' },
  { id: 'open', label: 'Abierto', color: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900' },
  { id: 'in_progress', label: 'En Progreso', color: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-900' },
  { id: 'waiting', label: 'Esperando', color: 'bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900' },
  { id: 'resolved', label: 'Resuelto', color: 'bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900' },
  { id: 'closed', label: 'Cerrado', color: 'bg-gray-50 border-gray-100 dark:bg-gray-900/20 dark:border-gray-800' },
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    new: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-900/50 dark:text-blue-100',
    open: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-800/50 dark:text-blue-100',
    in_progress: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-100',
    waiting: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-900/50 dark:text-purple-100',
    resolved: 'bg-green-500 hover:bg-green-600 dark:bg-green-900/50 dark:text-green-100',
    closed: 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-800/50 dark:text-gray-100',
  };
  return colors[status] || 'bg-gray-500 dark:bg-gray-800/50';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    new: 'Nuevo',
    open: 'Abierto',
    in_progress: 'En Progreso',
    waiting: 'Esperando',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };
  return colors[priority] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
};

export function TicketsView({ tickets: initialTickets }: TicketsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [syncing, setSyncing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Update local tickets when props change (e.g. navigation)
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  // Filter states
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');
  const [fromEmail, setFromEmail] = useState(searchParams.get('from_email') || '');
  const [toEmail, setToEmail] = useState(searchParams.get('to_email') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [bodyText, setBodyText] = useState(searchParams.get('body_text') || '');

  const hasActiveFilters = dateFrom || dateTo || fromEmail || toEmail || subject || bodyText;

  // Function to fetch latest tickets
  const fetchLatestTickets = async () => {
    const filters = {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      from_email: fromEmail || undefined,
      to_email: toEmail || undefined,
      subject: subject || undefined,
      body_text: bodyText || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
    };

    const result = await getLatestTickets(filters);
    if (result.success && result.data) {
      setTickets(result.data);
    }
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchLatestTickets();
    }, 60000); // 1 minute

    return () => clearInterval(intervalId);
  }, [dateFrom, dateTo, fromEmail, toEmail, subject, bodyText, searchParams]);

  // Sync logic
  const syncEmails = async (silent: boolean = false) => {
    setSyncing(true);
    try {
      // 1. Trigger backend sync (Slow)
      const response = await fetch('/api/admin/gmail/sync', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setLastSyncTime(new Date());
        
        // 2. Fetch latest data (Fast)
        await fetchLatestTickets();

        if (!silent) {
           toast.success('Sincronización completada');
        }
      } else {
        if (!silent) {
          toast.error(`Error sincronizando: ${data.error}`);
        }
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Apply filters to URL
  const applyFilters = () => {
      // The useEffect below handles this with debitnce
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFromEmail('');
    setToEmail('');
    setSubject('');
    setBodyText('');
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('date_from');
    params.delete('date_to');
    params.delete('from_email');
    params.delete('to_email');
    params.delete('subject');
    params.delete('body_text');
    
    router.push(`?${params.toString()}`);
  };

  // Trigger apply when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only push if there are changes compared to current params
      const currentParams = new URLSearchParams(searchParams.toString());
      const newParams = new URLSearchParams(currentParams);
      
      if (dateFrom) newParams.set('date_from', dateFrom); else newParams.delete('date_from');
      if (dateTo) newParams.set('date_to', dateTo); else newParams.delete('date_to');
      if (fromEmail) newParams.set('from_email', fromEmail); else newParams.delete('from_email');
      if (toEmail) newParams.set('to_email', toEmail); else newParams.delete('to_email');
      if (subject) newParams.set('subject', subject); else newParams.delete('subject');
      if (bodyText) newParams.set('body_text', bodyText); else newParams.delete('body_text');

      if (currentParams.toString() !== newParams.toString()) {
         router.push(`?${newParams.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [dateFrom, dateTo, fromEmail, toEmail, subject, bodyText, router, searchParams]);

  // Define Columns for List View
  const listColumns: ColumnDefinition<Ticket>[] = [
    {
      id: 'ticket',
      header: 'Nombre del Ticket',
      accessor: (ticket) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/communications/tickets/${ticket.id}`}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {ticket.ticket_number} {ticket.subject}
          </Link>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (ticket) => (
        <Badge className={getStatusColor(ticket.status)}>
          {getStatusLabel(ticket.status)}
        </Badge>
      ),
    },
    {
      id: 'priority',
      header: 'Prioridad',
      accessor: (ticket) => (
        <span className="capitalize">{getPriorityLabel(ticket.priority)}</span>
      ),
    },
    {
      id: 'date',
      header: 'Fecha de Creación',
      accessor: (ticket) => format(new Date(ticket.created_at), "d 'de' MMM, yyyy HH:mm", { locale: es }),
    },
    {
      id: 'owner',
      header: 'Propietario',
      accessor: (ticket) => ticket.owner_name || 'Sin propietario',
    },
  ];

  const listActions: RowAction<Ticket>[] = [
    {
      label: 'Ver detalles',
      href: (ticket) => `/admin/communications/tickets/${ticket.id}`,
    },
  ];

  // Render Kanban Card
  const renderKanbanCard = (ticket: Ticket, isOverlay?: boolean) => {
    return (
      <Card
        className={`cursor-grab hover:shadow-md transition-shadow bg-card text-card-foreground h-full min-h-[100px] flex flex-col justify-between ${
          isOverlay ? 'shadow-[0_20px_50px_rgba(0,0,0,0.25)] cursor-grabbing' : ''
        }`}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className="text-xs font-normal">
              {ticket.ticket_number}
            </Badge>
            <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(ticket.priority)} border-0`}>
              {ticket.priority}
            </Badge>
          </div>
          <CardTitle className="text-sm font-medium mt-1 leading-tight line-clamp-2">
            {isOverlay ? (
              <span>{ticket.subject}</span>
            ) : (
              <Link 
                href={`/admin/communications/tickets/${ticket.id}`}
                className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 decoration-2 decoration-blue-500/30 underline-offset-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {ticket.subject}
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex flex-col gap-2 mt-2 text-xs text-muted-foreground">
              {ticket.owner_name && (
                  <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{ticket.owner_name}</span>
                  </div>
              )}
              <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                      {format(new Date(ticket.created_at), "d MMM", { locale: es })}
                  </span>
              </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleKanbanColumnChange = async (recordId: string, newColumnId: string, oldColumnId: string) => {
     // Optimistic update handled by RecordKanbanView if we passed it state, 
     // but here RecordKanbanView handles internal state and we just confirm.
     // However, TicketsView also holds 'tickets' state. 
     // We need to update local state to match the change.
     
     const updatedTickets = tickets.map(t => 
       t.id === recordId ? { ...t, status: newColumnId } : t
     );
     setTickets(updatedTickets);

     const result = await updateTicketStatus(recordId, newColumnId);
     
     if (!result.success) {
        // Revert
        const revertedTickets = tickets.map(t => 
             t.id === recordId ? { ...t, status: oldColumnId } : t
        );
        setTickets(revertedTickets);
        return { success: false };
     }
     
     return { success: true };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus tickets y solicitudes de soporte
          </p>
        </div>
      </div>

      {/* Main Content Area with Toggle and Views */}
      <div className="flex flex-col gap-4 border rounded-lg p-4 bg-card">
         <RecordsViewToggle 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRefresh={() => syncEmails(false)}
            isRefreshing={syncing}
            actions={
               <>
                 {lastSyncTime && (
                    <span className="text-xs text-muted-foreground hidden sm:inline-block mr-2">
                      Sincronizado: {format(lastSyncTime, 'HH:mm', { locale: es })}
                    </span>
                 )}
                 <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] h-8 text-xs sm:text-sm">
                    <Link href="/admin/communications/tickets/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo
                    </Link>
                 </Button>
               </>
            }
            filterComponent={
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 hover:bg-transparent h-8"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <div className="flex items-center gap-2 border rounded-md px-3 py-1 text-sm bg-background hover:bg-muted font-normal">
                        <Search className="h-4 w-4" />
                        <span>Filtros</span>
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            {[dateFrom, dateTo, fromEmail, toEmail, subject, bodyText].filter(Boolean).length}
                            </Badge>
                        )}
                        {filtersOpen ? (
                           <ChevronUp className="h-4 w-4 ml-1 opacity-50" />
                        ) : (
                           <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                        )}
                    </div>
                </Button>
            }
         />

         {/* Advanced Filters Panel */}
         {filtersOpen && (
            <div className="space-y-4 pt-4 pb-2 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha desde</label>
                    <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha hasta</label>
                    <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Remitente</label>
                    <Input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="ejemplo@email.com"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Destinatario</label>
                    <Input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="ejemplo@email.com"
                    />
                </div>
                <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-medium">Asunto</label>
                    <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Buscar en asunto..."
                    />
                </div>
                 <div className="space-y-2 lg:col-span-3">
                    <label className="text-sm font-medium">Contenido</label>
                    <Input
                    type="text"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Buscar en el contenido..."
                    />
                </div>
                </div>
                {hasActiveFilters && (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <X className="mr-2 h-4 w-4" />
                        Limpiar filtros
                    </Button>
                </div>
                )}
            </div>
         )}
         
         {/* View Content */}
         <div className="h-[calc(100vh-320px)] overflow-hidden">
            {viewMode === 'list' ? (
                <div className="h-full overflow-y-auto">
                    <RecordListView 
                        records={tickets}
                        columns={listColumns}
                        rowActions={listActions}
                        isLoading={false}
                        emptyMessage="No se encontraron tickets."
                    />
                </div>
            ) : (
                <RecordKanbanView
                    records={tickets}
                    columns={KANBAN_COLUMNS}
                    getRecordColumn={(t) => t.status}
                    renderCard={renderKanbanCard}
                    onColumnChange={handleKanbanColumnChange}
                    minColumnHeight="100%"
                />
            )}
         </div>
      </div>
    </div>
  );
}
