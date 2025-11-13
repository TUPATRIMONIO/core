/**
 * Editar Ticket CRM
 * Formulario de edición de ticket existente
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditTicketForm from './EditTicketForm';

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

  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) redirect('/dashboard');

  // Obtener ticket
  const { data: ticket, error } = await supabase
    .schema('crm')
    .from('tickets')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single();

  if (error || !ticket) redirect('/dashboard/crm/tickets');

  return <EditTicketForm ticket={ticket} />;
}


