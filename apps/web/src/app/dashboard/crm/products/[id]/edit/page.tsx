/**
 * Editar Producto CRM
 * Formulario de edición de producto existente
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProductForm from './EditProductForm';
import { resolveActiveOrganizationId } from '@/lib/organizations/server';

export const metadata: Metadata = {
  title: 'Editar Producto - CRM',
};

export default async function EditProductPage({
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

  // Obtener producto
  const { data: product, error } = await supabase
    .schema('crm')
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !product) redirect('/dashboard/crm/products');

  return <EditProductForm product={product} />;
}



