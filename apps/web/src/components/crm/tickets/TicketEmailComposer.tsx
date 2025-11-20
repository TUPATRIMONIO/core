'use client';

/**
 * TicketEmailComposer
 * Compositor de emails inline para tickets (similar a HubSpot)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { EmailComposer } from '@/components/crm/EmailComposer';

interface TicketEmailComposerProps {
  ticketId: string;
  ticketNumber: string;
  ticketSubject: string;
  defaultTo?: string;
  contactId?: string;
  replyToThreadId?: string; // Thread ID del email al que se está respondiendo
  onSent?: () => void;
  onEmailSent?: () => void; // Callback específico para refrescar historial
  className?: string;
}

export function TicketEmailComposer({
  ticketId,
  ticketNumber,
  ticketSubject,
  defaultTo,
  contactId,
  replyToThreadId,
  onSent,
  onEmailSent,
  className = ''
}: TicketEmailComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSent = () => {
    setIsOpen(false);
    if (onEmailSent) {
      onEmailSent(); // Trigger refresh del historial
    }
    if (onSent) {
      onSent();
    }
    toast({
      title: 'Email enviado',
      description: 'El email se envió y se agregó al historial del ticket',
    });
  };

  if (!isOpen) {
    return (
      <div className={className}>
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          <Mail className="w-4 h-4 mr-2" />
          Nuevo Email
        </Button>
      </div>
    );
  }

  // Determinar el subject: si ticketSubject ya tiene "Re:", usarlo tal cual, sino agregar "Re:"
  const emailSubject = ticketSubject.startsWith('Re:') 
    ? ticketSubject 
    : `Re: [${ticketNumber}] ${ticketSubject}`;

  return (
    <div className={className}>
      <EmailComposer
        defaultTo={defaultTo}
        defaultSubject={emailSubject}
        contactId={contactId}
        ticketId={ticketId}
        replyToThreadId={replyToThreadId}
        onSent={handleSent}
        onCancel={() => setIsOpen(false)}
      />
    </div>
  );
}
