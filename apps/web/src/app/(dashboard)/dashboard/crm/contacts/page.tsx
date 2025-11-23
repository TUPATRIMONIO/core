import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User } from 'lucide-react';
import Link from 'next/link';

export default async function ContactsPage() {
  const supabase = await createClient();

  // Obtener organización del usuario (incluye platform org para platform admins)
  const { getUserActiveOrganization } = await import('@/lib/organization/utils');
  const orgResult = await getUserActiveOrganization(supabase);

  if (!orgResult.organization) {
    return (
      <div className="container mx-auto py-8">
        <p>No se encontró organización</p>
      </div>
    );
  }

  // Obtener contactos
  const { data: contacts, error } = await supabase
    .from('crm.contacts')
    .select('*')
    .eq('organization_id', orgResult.organization.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contactos</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus contactos y relaciones
          </p>
        </div>
        <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Link href="/dashboard/crm/contacts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contacto
          </Link>
        </Button>
      </div>

      {contacts && contacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact: any) => (
            <Card key={contact.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      {contact.first_name} {contact.last_name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contact.email && (
                    <p className="text-sm text-muted-foreground">
                      {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground">
                      {contact.phone}
                    </p>
                  )}
                  {contact.company_name && (
                    <p className="text-sm text-muted-foreground">
                      {contact.company_name}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/dashboard/crm/contacts/${contact.id}/edit`}>
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay contactos</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primer contacto
              </p>
              <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                <Link href="/dashboard/crm/contacts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Contacto
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

