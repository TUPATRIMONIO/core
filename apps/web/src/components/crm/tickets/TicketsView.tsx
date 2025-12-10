'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Plus, RefreshCw, Filter, Search, ChevronDown, ChevronUp, X, Mail } from 'lucide-react';
import Link from 'next/link';
import { TicketList } from './TicketList';
import { TicketKanban } from './TicketKanban';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to: string;
  owner_name?: string;
  description?: string; // Added for Kanban
}

interface TicketsViewProps {
  tickets: Ticket[];
}

export function TicketsView({ tickets }: TicketsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [syncing, setSyncing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Filter states initialized from URL
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');
  const [fromEmail, setFromEmail] = useState(searchParams.get('from_email') || '');
  const [toEmail, setToEmail] = useState(searchParams.get('to_email') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [bodyText, setBodyText] = useState(searchParams.get('body_text') || '');

  const hasActiveFilters = dateFrom || dateTo || fromEmail || toEmail || subject || bodyText;

  // Sync logic
  const syncEmails = async (silent: boolean = false) => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/gmail/sync', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setLastSyncTime(new Date());
        if (!silent) {
          alert(`Sincronización completada: ${data.message}`);
        }
        router.refresh();
      } else {
        if (!silent) {
          alert(`Error sincronizando: ${data.error}`);
        }
      }
    } catch (error: any) {
      if (!silent) {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Apply filters to URL
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (dateFrom) params.set('date_from', dateFrom); else params.delete('date_from');
    if (dateTo) params.set('date_to', dateTo); else params.delete('date_to');
    if (fromEmail) params.set('from_email', fromEmail); else params.delete('from_email');
    if (toEmail) params.set('to_email', toEmail); else params.delete('to_email');
    if (subject) params.set('subject', subject); else params.delete('subject');
    if (bodyText) params.set('body_text', bodyText); else params.delete('body_text');

    router.push(`?${params.toString()}`);
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


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus tickets y solicitudes de soporte
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-muted rounded-md p-1 border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              title="Vista de lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={`h-8 w-8 p-0 ${viewMode === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              title="Vista Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={() => syncEmails(false)}
            disabled={syncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>

          <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
            <Link href="/admin/communications/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 border rounded-lg p-4 bg-card">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 hover:bg-transparent"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <span className="font-medium">Filtros Avanzados</span>
                         {hasActiveFilters && (
                            <Badge variant="secondary">
                            {[dateFrom, dateTo, fromEmail, toEmail, subject, bodyText].filter(Boolean).length}
                            </Badge>
                        )}
                         {filtersOpen ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                    </div>
                </Button>
            </div>
             {lastSyncTime && (
                <span className="text-xs text-muted-foreground">
                  Sincronizado: {format(lastSyncTime, 'HH:mm', { locale: es })}
                </span>
             )}
         </div>

         {filtersOpen && (
            <div className="space-y-4 pt-2 border-t">
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
      </div>

      <div className="h-[calc(100vh-320px)] overflow-hidden">
         {viewMode === 'list' ? (
           <div className="h-full overflow-y-auto">
             <TicketList tickets={tickets} />
           </div>
         ) : (
           <TicketKanban tickets={tickets} />
         )}
      </div>
    </div>
  );
}
