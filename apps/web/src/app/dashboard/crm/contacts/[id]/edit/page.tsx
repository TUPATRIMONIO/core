/**
 * Editar Contacto CRM
 * Formulario de edición de contacto existente
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditContactForm from './EditContactForm';

export const metadata: Metadata = {
  title: 'Editar Contacto - CRM',
};

export default async function EditContactPage({
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

  // Obtener contacto
  const { data: contact, error } = await supabase
    .schema('crm')
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single();

  if (error || !contact) redirect('/dashboard/crm/contacts');

  return <EditContactForm contact={contact} />;
}


