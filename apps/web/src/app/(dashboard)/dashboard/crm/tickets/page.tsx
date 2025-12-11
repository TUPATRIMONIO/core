import { createClient } from '@/lib/supabase/server';
import { TicketsView } from '@/components/crm/tickets/TicketsView';
import { getUserActiveOrganization } from '@/lib/organization/utils';

interface PageProps {
  searchParams: Promise<{
    date_from?: string;
    date_to?: string;
    from_email?: string;
    to_email?: string;
    subject?: string;
    body_text?: string;
    status?: string;
    priority?: string;
  }>;
}

export default async function CrmTicketsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const filters = await searchParams;

  const { organization } = await getUserActiveOrganization(supabase);

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <p>No se encontró organización</p>
      </div>
    );
  }

  // Construir query base
  let query = supabase
    .from('tickets')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  if (filters.subject) {
    query = query.ilike('subject', `%${filters.subject}%`);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  const { data: tickets, error } = await query;

  if (error) {
    console.error('Error fetching tickets:', error);
  }

  const finalTickets = tickets?.map((t: any) => ({
    ...t,
    owner_name: t.assigned_to ? `Usuario ${t.assigned_to.substring(0, 8)}...` : null, // Fallback visual
  })) || [];

  return (
    <div className="container mx-auto py-8">
      <TicketsView tickets={finalTickets} basePath="/dashboard/crm/tickets" />
    </div>
  );
}
