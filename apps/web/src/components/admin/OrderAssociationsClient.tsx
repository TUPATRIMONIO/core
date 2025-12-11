'use client';

import { useState, useTransition } from 'react';
import { AssociationsPanel, AssociationSection, AssociatedItem } from '@/components/shared/AssociationsPanel';
import { AssociationSelector } from '@/components/crm/tickets/AssociationSelector';
import { linkEntityGeneric, unlinkEntityGeneric, AssociationType, EntityType } from '@/app/actions/crm/associations';
import { toast } from 'sonner';

interface OrderAssociationsClientProps {
  orderId: string;
  initialOrganizations: AssociatedItem[];
  initialContacts: AssociatedItem[];
  initialTickets: AssociatedItem[];
}

export function OrderAssociationsClient({
  orderId,
  initialOrganizations,
  initialContacts,
  initialTickets,
}: OrderAssociationsClientProps) {
  const [organizations, setOrganizations] = useState<AssociatedItem[]>(initialOrganizations); // Unified into array
  const [contacts, setContacts] = useState<AssociatedItem[]>(initialContacts);
  const [tickets, setTickets] = useState<AssociatedItem[]>(initialTickets);
  const [isPending, startTransition] = useTransition();

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorType, setSelectorType] = useState<AssociationType>('contact');

  const handleAddToSection = (sectionId: string, sectionType: string) => {
    // Map section type to association type
    const typeMap: Record<string, AssociationType> = {
      contact: 'contact',
      ticket: 'ticket',
      organization: 'organization',
    };
    setSelectorType(typeMap[sectionType] || 'contact');
    setSelectorOpen(true);
  };

  const handleSelectEntity = async (entityId: string, source?: string, item?: any) => {
    setSelectorOpen(false);

    startTransition(async () => {
      const result = await linkEntityGeneric('order', orderId, selectorType, entityId, source);

      if (result.success) {
        toast.success('Asociación creada');
        // Optimistic update
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
        } else if (selectorType === 'organization') {
            setOrganizations(prev => [...prev, {
                id: entityId,
                name: item?.top_text || 'Organización',
                subtext: item?.sub_text || ''
            }]);
        }
      } else {
        toast.error(result.error || 'Error al crear asociación');
      }
    });
  };

  const handleRemoveItem = async (sectionId: string, itemId: string) => {
    // Map section ID to target type
    const typeMap: Record<string, AssociationType> = {
      contacts: 'contact',
      tickets: 'ticket',
      organizations: 'organization',
    };
    const targetType = typeMap[sectionId];

    if (!targetType) return;

    startTransition(async () => {
      const result = await unlinkEntityGeneric('order', orderId, targetType, itemId);

      if (result.success) {
        toast.success('Asociación eliminada');
        if (sectionId === 'contacts') {
          setContacts(prev => prev.filter(c => c.id !== itemId));
        } else if (sectionId === 'tickets') {
          setTickets(prev => prev.filter(t => t.id !== itemId));
        } else if (sectionId === 'organizations') {
          setOrganizations(prev => prev.filter(o => o.id !== itemId));
        }
      } else {
        toast.error(result.error || 'Error al eliminar asociación');
      }
    });
  };

  // Build sections
  const sections: AssociationSection[] = [];

  // Organizations (editable)
  sections.push({
      id: 'organizations',
      title: 'Organizaciones',
      type: 'organization',
      items: organizations.map(o => ({
          ...o,
          href: `/admin/organizations/${o.id}`,
      })),
      canAdd: true,
      canRemove: true,
  });

  // Contacts (editable)
  sections.push({
    id: 'contacts',
    title: 'Contactos',
    type: 'contact',
    items: contacts.map(c => ({
      ...c,
      href: `/admin/contacts/${c.id}`,
    })),
    canAdd: true,
    canRemove: true,
  });

  // Tickets (editable)
  sections.push({
    id: 'tickets',
    title: 'Tickets',
    type: 'ticket',
    items: tickets.map(t => ({
      ...t,
      href: `/admin/communications/tickets/${t.id}`,
    })),
    canAdd: true,
    canRemove: true,
  });

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

export default OrderAssociationsClient;
