import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditTicketForm } from '@/components/crm/EditTicketForm';
import { Ticket } from '@/types/crm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTicketPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Obtener ticket de vista pública
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !ticket) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm/tickets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Ticket</h1>
            <p className="text-muted-foreground mt-2">
              {ticket.ticket_number} - {ticket.subject}
            </p>
          </div>
        </div>
      </div>

      <EditTicketForm ticket={ticket as Ticket} />
    </div>
  );
}

