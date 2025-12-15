'use client';

import { useState, useTransition, useEffect } from 'react';
import { AssociationsPanel, AssociationSection, AssociatedItem } from '@/components/shared/AssociationsPanel';
import { AssociationSelector } from '@/components/crm/tickets/AssociationSelector';
import { linkEntityGeneric, unlinkEntityGeneric } from '@/app/actions/crm/associations';
import { toast } from 'sonner';

interface OrderTicketsPanelProps {
  orderId: string;
  initialTickets: AssociatedItem[];
}

export function OrderTicketsPanel({
  orderId,
  initialTickets,
}: OrderTicketsPanelProps) {
  const [tickets, setTickets] = useState<AssociatedItem[]>(initialTickets);
  const [isPending, startTransition] = useTransition();

  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const handleAddToSection = (sectionId: string, sectionType: string) => {
    // Solo permitimos tickets aquí
    setSelectorOpen(true);
  };

  const handleSelectEntity = async (entityId: string, source?: string, item?: any) => {
    setSelectorOpen(false);

    startTransition(async () => {
      const result = await linkEntityGeneric('order', orderId, 'ticket', entityId, source);

      if (result.success) {
        toast.success('Ticket asociado');
        // Optimistic update
        setTickets(prev => [...prev, { 
          id: entityId, 
          name: item?.top_text || 'Ticket', 
          subtext: item?.sub_text || '' 
        }]);
      } else {
        toast.error(result.error || 'Error al asociar ticket');
      }
    });
  };

  const handleRemoveItem = async (sectionId: string, itemId: string) => {
    startTransition(async () => {
      const result = await unlinkEntityGeneric('order', orderId, 'ticket', itemId);

      if (result.success) {
        toast.success('Asociación eliminada');
        setTickets(prev => prev.filter(t => t.id !== itemId));
      } else {
        toast.error(result.error || 'Error al eliminar asociación');
      }
    });
  };

  // Build section for tickets
  const sections: AssociationSection[] = [{
    id: 'tickets',
    title: 'Tickets Asociados',
    type: 'ticket',
    items: tickets.map(t => ({
      ...t,
      href: `/admin/communications/tickets/${t.id}`,
    })),
    canAdd: true,
    canRemove: true,
  }];

  return (
    <>
      <AssociationsPanel
        title="Comunicaciones"
        sections={sections}
        onAddToSection={handleAddToSection}
        onRemoveItem={handleRemoveItem}
        isLoading={isPending}
      />

      <AssociationSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        type="ticket"
        onSelect={handleSelectEntity}
      />
    </>
  );
}



