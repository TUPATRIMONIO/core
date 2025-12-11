'use client';

import { CreateTicketDialog } from '@/components/crm/CreateTicketDialog';

interface CreateTicketButtonForOrderProps {
  orderId: string;
  orderNumber: string;
  organizationName?: string;
}

export function CreateTicketButtonForOrder({ 
  orderId, 
  orderNumber,
  organizationName 
}: CreateTicketButtonForOrderProps) {
  return (
    <CreateTicketDialog
      association={{
        type: 'order',
        id: orderId,
        label: orderNumber,
        sublabel: organizationName,
      }}
    />
  );
}

interface CreateTicketButtonForOrganizationProps {
  organizationId: string;
  organizationName: string;
  organizationSlug?: string;
}

export function CreateTicketButtonForOrganization({ 
  organizationId, 
  organizationName,
  organizationSlug 
}: CreateTicketButtonForOrganizationProps) {
  return (
    <CreateTicketDialog
      association={{
        type: 'organization',
        id: organizationId,
        label: organizationName,
        sublabel: organizationSlug,
      }}
    />
  );
}

interface CreateTicketButtonForUserProps {
  userId: string;
  userName: string;
  userEmail?: string;
}

export function CreateTicketButtonForUser({ 
  userId, 
  userName,
  userEmail 
}: CreateTicketButtonForUserProps) {
  return (
    <CreateTicketDialog
      association={{
        type: 'user',
        id: userId,
        label: userName,
        sublabel: userEmail,
      }}
    />
  );
}
