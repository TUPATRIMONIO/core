/**
 * Editar Deal CRM
 * Formulario de edición de deal existente
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditDealForm from './EditDealForm';
import { resolveActiveOrganizationId } from '@/lib/organizations/server';

export const metadata: Metadata = {
  title: 'Editar Negocio - CRM',
};

export default async function EditDealPage({
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

  // Obtener deal
  const { data: deal, error } = await supabase
    .schema('crm')
    .from('deals')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !deal) redirect('/dashboard/crm/deals');

  return <EditDealForm deal={deal} />;
}



