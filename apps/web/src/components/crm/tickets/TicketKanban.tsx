'use client';

import Link from 'next/link';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCorners,
} from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateTicketStatus } from '@/app/actions/crm/tickets';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ticket as TicketIcon, Calendar, User, AlertCircle } from 'lucide-react';
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
  description?: string;
}

interface TicketKanbanProps {
  tickets: Ticket[];
  basePath?: string;
}

const COLUMNS = [
  { id: 'new', label: 'Nuevo', color: 'bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800' },
  { id: 'open', label: 'Abierto', color: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900' },
  { id: 'in_progress', label: 'En Progreso', color: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-900' },
  { id: 'waiting', label: 'Esperando', color: 'bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900' },
  { id: 'resolved', label: 'Resuelto', color: 'bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900' },
  { id: 'closed', label: 'Cerrado', color: 'bg-gray-50 border-gray-100 dark:bg-gray-900/20 dark:border-gray-800' },
];

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };
  return colors[priority] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
};

function KanbanCard({ ticket, isOverlay = false, basePath = '/dashboard/crm/tickets' }: { ticket: Ticket; isOverlay?: boolean; basePath?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
    disabled: isOverlay,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`mb-3 cursor-grab hover:shadow-md transition-shadow bg-card text-card-foreground ${
        isDragging ? 'opacity-50' : ''
      } ${isOverlay ? 'shadow-[0_20px_50px_rgba(0,0,0,0.25)] cursor-grabbing' : ''}`}
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
              href={`${basePath}/${ticket.id}`}
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
}

function KanbanColumn({ column, tickets, basePath }: { column: typeof COLUMNS[0]; tickets: Ticket[]; basePath?: string }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-1 min-w-[280px] h-full flex flex-col">
      <div className={`p-3 rounded-t-md border-b-2 font-medium flex justify-between items-center bg-background/50 backdrop-blur-sm ${column.color}`}>
        <span>{column.label}</span>
        <Badge variant="secondary" className="text-xs">
          {tickets.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 bg-muted/30 p-2 rounded-b-md border border-t-0 border-border overflow-y-auto min-h-[500px]`}
      >
        {tickets.map((ticket) => (
          <KanbanCard key={ticket.id} ticket={ticket} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}

export function TicketKanban({ tickets: initialTickets, basePath = '/dashboard/crm/tickets' }: TicketKanbanProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id && over.id) {
      const ticketId = active.id as string;
      const newStatus = over.id as string;

      // Find original status to check if changed
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex !== -1 && tickets[ticketIndex].status !== newStatus) {
         const oldStatus = tickets[ticketIndex].status;
         
         // Optimistic update
         const newTickets = [...tickets];
         newTickets[ticketIndex] = { ...newTickets[ticketIndex], status: newStatus };
         setTickets(newTickets);

         // Call server action
         const result = await updateTicketStatus(ticketId, newStatus);
         if (!result.success) {
            toast.error('Error al actualizar estado');
            // Revert on failure
            const revertedTickets = [...tickets];
            revertedTickets[ticketIndex] = { ...revertedTickets[ticketIndex], status: oldStatus };
            setTickets(revertedTickets);
         } else {
             toast.success('Estado actualizado');
         }
      }
    }

    setActiveId(null);
  };

  const activeTicket = activeId ? tickets.find((t) => t.id === activeId) : null;

  return (
    <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tickets={tickets.filter((t) => t.status === col.id)}
            basePath={basePath}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket ? <KanbanCard ticket={activeTicket} isOverlay basePath={basePath} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
