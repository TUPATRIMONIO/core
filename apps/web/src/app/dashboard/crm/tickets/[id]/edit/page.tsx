/**
 * Editar Ticket CRM
 * Formulario de edición de ticket existente
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditTicketForm from './EditTicketForm';
import { resolveActiveOrganizationId } from '@/lib/organizations/server';

export const metadata: Metadata = {
  title: 'Editar Ticket - CRM',
};

export default async function EditTicketPage({
  params
}: {
  params: { id: string }
}) {
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
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !ticket) redirect('/dashboard/crm/tickets');

  return <EditTicketForm ticket={ticket} />;
}



