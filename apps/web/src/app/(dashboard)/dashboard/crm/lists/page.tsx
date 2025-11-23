import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';

async function getLists() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/communications/lists`, {
    cache: 'no-store',
  });
  const { data } = await response.json();
  return data || [];
}

export default async function ListsPage() {
  const lists = await getLists();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listas de Contactos</h1>
          <p className="text-muted-foreground mt-2">
            Organiza tus contactos en listas para campañas de email
          </p>
        </div>
        <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Link href="/dashboard/crm/lists/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Lista
          </Link>
        </Button>
      </div>

      {lists && lists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list: any) => (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{list.contact_count || 0} contactos</Badge>
                </div>
                {list.description && (
                  <CardDescription className="mt-2">{list.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/crm/lists/${list.id}`}>Gestionar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay listas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera lista de contactos
              </p>
              <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                <Link href="/dashboard/crm/lists/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Lista
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

