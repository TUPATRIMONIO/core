'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to: string; // UUID
  contact_id?: string;
  // joined fields
  owner_name?: string;
}

interface TicketListProps {
  tickets: Ticket[];
}

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

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No se encontraron tickets.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del Ticket</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Fecha de Creación</TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <div className="flex flex-col">
                  <Link
                    href={`/admin/communications/tickets/${ticket.id}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {ticket.ticket_number} {ticket.subject}
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(ticket.status)}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="capitalize">{getPriorityLabel(ticket.priority)}</span>
              </TableCell>
              <TableCell>
                {format(new Date(ticket.created_at), "d 'de' MMM, yyyy HH:mm", {
                  locale: es,
                })}
              </TableCell>
              <TableCell>
                {ticket.owner_name || 'Sin propietario'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/communications/tickets/${ticket.id}`}>
                        Ver detalles
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
