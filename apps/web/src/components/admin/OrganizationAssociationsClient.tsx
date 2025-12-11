'use client';

import { useState, useTransition } from 'react';
import { AssociationsPanel, AssociationSection, AssociatedItem } from '@/components/shared/AssociationsPanel';
import { AssociationSelector } from '@/components/crm/tickets/AssociationSelector';
import { linkEntityGeneric, unlinkEntityGeneric, AssociationType, EntityType } from '@/app/actions/crm/associations';
import { toast } from 'sonner';

interface OrganizationAssociationsClientProps {
  organizationId: string;
  initialContacts: AssociatedItem[];
  initialTickets: AssociatedItem[];
  initialApps: AssociatedItem[];
  initialOrders: AssociatedItem[];
}

export function OrganizationAssociationsClient({
  organizationId,
  initialContacts,
  initialTickets,
  initialApps,
  initialOrders,
}: OrganizationAssociationsClientProps) {
  const [contacts, setContacts] = useState<AssociatedItem[]>(initialContacts);
  const [tickets, setTickets] = useState<AssociatedItem[]>(initialTickets);
  const [apps, setApps] = useState<AssociatedItem[]>(initialApps);
  const [orders, setOrders] = useState<AssociatedItem[]>(initialOrders);
  const [isPending, startTransition] = useTransition();

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorType, setSelectorType] = useState<AssociationType>('contact');

  const handleAddToSection = (sectionId: string, sectionType: string) => {
    const typeMap: Record<string, AssociationType> = {
      contact: 'contact',
      ticket: 'ticket',
      application: 'application',
      order: 'order',
    };
    setSelectorType(typeMap[sectionType] || 'contact');
    setSelectorOpen(true);
  };

  const handleSelectEntity = async (entityId: string, source?: string, item?: any) => {
    setSelectorOpen(false);

    startTransition(async () => {
      const result = await linkEntityGeneric('organization', organizationId, selectorType, entityId, source);

      if (result.success) {
        toast.success('Asociación creada');
        if (selectorType === 'contact') {
          setContacts(prev => [...prev, { 
            id: entityId, 
            name: item?.top_text || 'Desconocido', 
            subtext: item?.sub_text || '',
            avatar: item?.avatar
          }]);
        } else if (selectorType === 'ticket') {
          setTickets(prev => [...prev, { 
            id: entityId, 
            name: item?.top_text || 'Ticket', 
            subtext: item?.sub_text || '' 
          }]);
        } else if (selectorType === 'application') {
            setApps(prev => [...prev, {
                id: entityId,
                name: item?.top_text || 'App',
                subtext: item?.sub_text || ''
            }]);
        } else if (selectorType === 'order') {
            setOrders(prev => [...prev, {
                id: entityId,
                name: item?.top_text || 'Pedido',
                subtext: item?.sub_text || ''
            }]);
        }
      } else {
        toast.error(result.error || 'Error al crear asociación');
      }
    });
  };

  const handleRemoveItem = async (sectionId: string, itemId: string) => {
    const typeMap: Record<string, AssociationType> = {
      contacts: 'contact',
      tickets: 'ticket',
      apps: 'application',
      orders: 'order',
    };
    const targetType = typeMap[sectionId];
    if (!targetType) return;

    startTransition(async () => {
      const result = await unlinkEntityGeneric('organization', organizationId, targetType, itemId);

      if (result.success) {
        toast.success(sectionId === 'apps' ? 'Aplicación deshabilitada' : 'Asociación eliminada');
        if (sectionId === 'contacts') {
          setContacts(prev => prev.filter(c => c.id !== itemId));
        } else if (sectionId === 'tickets') {
          setTickets(prev => prev.filter(t => t.id !== itemId));
        } else if (sectionId === 'apps') {
          setApps(prev => prev.filter(a => a.id !== itemId));
        } else if (sectionId === 'orders') {
          setOrders(prev => prev.filter(o => o.id !== itemId));
        }
      } else {
        toast.error(result.error || 'Error al eliminar asociación');
      }
    });
  };

  const sections: AssociationSection[] = [
    {
      id: 'apps',
      title: 'Aplicaciones Habilitadas',
      type: 'application',
      items: apps.map(a => ({
        ...a,
        // No generic detail page for apps usually, but let's leave generic ID or #
      })),
      canAdd: true,
      canRemove: true,
    },
    {
      id: 'contacts',
      title: 'Contactos',
      type: 'contact',
      items: contacts.map(c => ({
        ...c,
        href: `/admin/contacts/${c.id}`,
      })),
      canAdd: true,
      canRemove: true,
    },
    {
      id: 'orders',
      title: 'Pedidos de esta Organización',
      type: 'order',
      items: orders.map(o => ({
        ...o,
        href: `/admin/orders/${o.id}`,
      })),
      canAdd: false,  // Informativo: muestra pedidos reales comprados
      canRemove: false,
    },
    {
      id: 'tickets',
      title: 'Tickets',
      type: 'ticket',
      items: tickets.map(t => ({
        ...t,
        href: `/admin/communications/tickets/${t.id}`,
      })),
      canAdd: true,
      canRemove: true,
    },
  ];

  return (
    <>
      <AssociationsPanel
        title="Relaciones"
        sections={sections}
        onAddToSection={handleAddToSection}
        onRemoveItem={handleRemoveItem}
        isLoading={isPending}
      />

      <AssociationSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        type={selectorType}
        onSelect={handleSelectEntity}
      />
    </>
  );
}

export default OrganizationAssociationsClient;
