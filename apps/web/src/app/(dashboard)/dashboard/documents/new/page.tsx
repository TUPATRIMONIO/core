import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserActiveOrganization } from '@/lib/organization/utils';

export default async function NewDocumentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { organization: org } = await getUserActiveOrganization(supabase);
  if (!org) {
    redirect('/onboarding');
  }

  // Crear documento nuevo usando RPC
  const { data: document, error } = await supabase.rpc('create_document', {
    p_title: 'Sin título',
    p_content: { type: 'doc', content: [{ type: 'paragraph' }] },
    p_organization_id: org.id,
  });

  if (error || !document) {
    console.error('Error creating document:', error);
    redirect('/dashboard/documents');
  }

  // Redirigir al editor
  redirect(`/dashboard/documents/${document.id}`);
}
