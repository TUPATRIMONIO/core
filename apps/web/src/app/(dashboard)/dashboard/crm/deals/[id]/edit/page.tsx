import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditDealForm } from '@/components/crm/EditDealForm';
import { Deal } from '@/types/crm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDealPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Obtener organización del usuario
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
    notFound();
  }

  // Obtener deal
  const { data: deal, error } = await supabase
    .from('crm.deals')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgUser.organization_id)
    .single();

  if (error || !deal) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm/deals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Deal</h1>
            <p className="text-muted-foreground mt-2">
              {deal.name}
            </p>
          </div>
        </div>
      </div>

      <EditDealForm deal={deal as Deal} />
    </div>
  );
}

