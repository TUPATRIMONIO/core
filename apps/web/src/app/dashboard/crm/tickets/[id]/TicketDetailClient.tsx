'use client';

/**
 * TicketDetailClient
 * Componente cliente con funcionalidad interactiva del ticket
 * Layout tipo HubSpot: Izquierda (propiedades), Centro (historial), Derecha (asociaciones)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PipelineStageSelector } from '@/components/crm/universal/PipelineStageSelector';
import { CustomFieldsSection } from '@/components/crm/universal/CustomFieldsSection';
import { TicketEmailHistory } from '@/components/crm/tickets/TicketEmailHistory';
import { TicketContactsManager } from '@/components/crm/tickets/TicketContactsManager';
import { TicketEmailComposer } from '@/components/crm/tickets/TicketEmailComposer';
import { TicketAssociations } from '@/components/crm/tickets/TicketAssociations';
import { FloatingSaveButton } from '@/components/crm/tickets/FloatingSaveButton';
import { usePendingChanges } from '@/hooks/usePendingChanges';
import type { Ticket } from '@/types/crm';

interface TicketEmail {
  email_id: string;
  subject: string;
  from_email: string;
  to_emails: string[];
  body_html?: string;
  body_text?: string;
  direction: 'inbound' | 'outbound';
  sent_at: string;
  is_read: boolean;
  contact_name?: string;
  thread_id?: string;
  message_id?: string;
}

interface TicketDetailClientProps {
  ticket: Ticket;
}

export function TicketDetailClient({ ticket }: TicketDetailClientProps) {
  const router = useRouter();

  // Sistema de cambios pendientes
  const {
    pendingChanges,
    hasPendingChanges,
    saving,
    updateField,
    saveChanges,
    resetChanges,
    getFieldValue
  } = usePendingChanges({
    onSave: async (changes) => {
      const response = await fetch(`/api/crm/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      });

      if (!response.ok) throw new Error('Error al guardar cambios');
      
      router.refresh();
    },
    initialData: ticket
  });

  const handleStageChange = async (stageId: string) => {
    updateField('stage_id', stageId);
  };

  const handleSaveCustomFields = async (customFields: Record<string, any>) => {
    updateField('custom_fields', customFields);
  };

  const [emailRefreshKey, setEmailRefreshKey] = useState(0);
  const [replyToEmail, setReplyToEmail] = useState<TicketEmail | null>(null);

  const handleEmailSent = () => {
    setEmailRefreshKey(prev => prev + 1); // Trigger refresh del historial
    setReplyToEmail(null); // Cerrar composer de respuesta
    router.refresh();
  };

  const handleReplyToEmail = (email: TicketEmail) => {
    setReplyToEmail(email);
  };

  // Obtener emails de contactos asociados para pre-llenar
  const getDefaultEmail = () => {
    if (ticket.contact?.email) return ticket.contact.email;
    return '';
  };

  return (
    <>
      {/* Layout de 3 columnas tipo HubSpot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: Propiedades */}
        <div className="lg:col-span-3 space-y-6">
          {/* Etapa del Pipeline */}
          {ticket.pipeline_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <PipelineStageSelector
                  pipelineId={ticket.pipeline_id}
                  currentStageId={getFieldValue('stage_id')}
                  originalStageId={ticket.stage_id}
                  onChange={handleStageChange}
                  disabled={saving}
                  className="w-full"
                />
              </CardContent>
            </Card>
          )}

          {/* Propiedades Personalizadas */}
          <CustomFieldsSection
            entityType="ticket"
            organizationId={ticket.organization_id}
            customFields={getFieldValue('custom_fields') || {}}
            onChange={handleSaveCustomFields}
            readOnly={false}
          />
        </div>

        {/* COLUMNA CENTRO: Historial de Actividades */}
        <div className="lg:col-span-6 space-y-6">
          {/* Composer de Email Inline o Respuesta */}
          {replyToEmail ? (
            <TicketEmailComposer
              ticketId={ticket.id}
              ticketNumber={ticket.ticket_number}
              ticketSubject={replyToEmail.subject.startsWith('Re:') ? replyToEmail.subject : `Re: ${replyToEmail.subject}`}
              defaultTo={replyToEmail.direction === 'inbound' ? replyToEmail.from_email : replyToEmail.to_emails[0]}
              contactId={ticket.contact?.id}
              replyToThreadId={replyToEmail.thread_id || replyToEmail.message_id || replyToEmail.email_id}
              onEmailSent={handleEmailSent}
              onSent={handleEmailSent}
            />
          ) : (
            <TicketEmailComposer
              ticketId={ticket.id}
              ticketNumber={ticket.ticket_number}
              ticketSubject={ticket.subject}
              defaultTo={getDefaultEmail()}
              contactId={ticket.contact?.id}
              onEmailSent={handleEmailSent}
              onSent={handleEmailSent}
            />
          )}

          {/* Historial de Emails y Actividades */}
          <TicketEmailHistory 
            ticketId={ticket.id}
            ticketNumber={ticket.ticket_number}
            ticketSubject={ticket.subject}
            refreshTrigger={emailRefreshKey}
            onReply={handleReplyToEmail}
          />
        </div>

        {/* COLUMNA DERECHA: Asociaciones */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contactos */}
          <TicketContactsManager
            ticketId={ticket.id}
            onEmailToContact={(email, name) => {
              // El composer se manejará desde el manager
            }}
          />

          {/* Empresas y Negocios */}
          <TicketAssociations
            ticketId={ticket.id}
            companyId={ticket.company?.id}
            companyName={ticket.company?.name}
            companyDomain={ticket.company?.domain}
          />
        </div>
      </div>

      {/* Botón flotante de guardar */}
      <FloatingSaveButton
        show={hasPendingChanges}
        saving={saving}
        onSave={saveChanges}
        onCancel={resetChanges}
        changesCount={Object.keys(pendingChanges).length}
      />
    </>
  );
}

