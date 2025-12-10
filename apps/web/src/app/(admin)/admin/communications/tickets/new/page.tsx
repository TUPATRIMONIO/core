import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateTicketForm } from '@/components/crm/CreateTicketForm';

export default async function AdminNewTicketPage() {
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/communications/tickets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nuevo Ticket (Admin)</h1>
            <p className="text-muted-foreground mt-2">
              Crea un nuevo ticket de soporte desde el panel de administración
            </p>
          </div>
        </div>
      </div>

      <CreateTicketForm />
    </div>
  );
}
