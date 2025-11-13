/**
 * Lista de Tickets CRM
 * Sistema de soporte al cliente
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/crm/StatusBadge';
import { EmptyState } from '@/components/crm/EmptyState';
import { Ticket, Plus, Search, AlertCircle } from 'lucide-react';
import type { Ticket as TicketType, TicketStatus, TicketPriority } from '@/types/crm';
import { formatRelativeTime } from '@/lib/crm/helpers';

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, search]);

  async function loadTickets() {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/crm/tickets?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const result = await response.json();
      setTickets(result.data || []);
      setTotal(result.count || 0);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tickets de Soporte
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'ticket' : 'tickets'} en total
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/crm/tickets/new')}
          className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Tickets */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Cargando tickets...
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No hay tickets"
              description="Los tickets de soporte aparecerán aquí"
              actionLabel="Crear Ticket"
              onAction={() => router.push('/dashboard/crm/tickets/new')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Contacto/Empresa</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => router.push(`/dashboard/crm/tickets/${ticket.id}`)}
                  >
                    <TableCell>
                      <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ticket.ticket_number}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {ticket.subject}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-700 dark:text-gray-300">
                        {ticket.company?.name || ticket.contact?.full_name || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        type="ticket-priority" 
                        value={ticket.priority as TicketPriority} 
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        type="ticket-status" 
                        value={ticket.status as TicketStatus} 
                      />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatRelativeTime(ticket.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/tickets/${ticket.id}`);
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


