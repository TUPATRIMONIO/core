/**
 * Detalle de Ticket CRM
 * Vista completa del ticket de soporte
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/crm/StatusBadge';
import { 
  ArrowLeft,
  Building2,
  User,
  Calendar,
  AlertCircle,
  Edit,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import type { Ticket as TicketType, TicketStatus, TicketPriority } from '@/types/crm';
import { formatRelativeTime } from '@/lib/crm/formatters';
import { resolveActiveOrganizationId } from '@/lib/organizations/server';
import { TicketDetailClient } from './TicketDetailClient';

export const metadata: Metadata = {
  title: 'Detalle de Ticket - CRM',
};

export default async function TicketDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: canAccess } = await supabase.rpc('can_access_crm', { user_id: user.id });
  if (!canAccess) redirect('/dashboard');

  const { organizationId, needsSelection } = await resolveActiveOrganizationId(supabase, user.id);

  if (needsSelection) redirect('/dashboard/select-organization');
  if (!organizationId) redirect('/dashboard');

  // Obtener ticket
  const { data: ticket, error } = await supabase
    .schema('crm')
    .from('tickets')
    .select(`
      *,
      contact:contacts(id, full_name, email, phone),
      company:companies(id, name, domain)
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !ticket) redirect('/dashboard/crm/tickets');

  // Obtener actividades del ticket
  const { data: activities } = await supabase
    .schema('crm')
    .from('activities')
    .select('*')
    .eq('ticket_id', id)
    .eq('organization_id', organizationId)
    .order('performed_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {ticket.ticket_number}
            </h1>
            <StatusBadge type="ticket-priority" value={ticket.priority as TicketPriority} />
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {ticket.subject}
          </p>
        </div>
        <StatusBadge type="ticket-status" value={ticket.status as TicketStatus} />
        <Link href={`/dashboard/crm/tickets/${ticket.id}/edit`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Descripción del Ticket */}
      {ticket.description && (
        <Card>
          <CardHeader>
            <CardTitle>Acerca de este ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Componentes Interactivos Cliente - Layout tipo HubSpot */}
      <TicketDetailClient ticket={ticket} />
    </div>
  );
}



