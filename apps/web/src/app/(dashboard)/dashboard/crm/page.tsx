import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Contact, Building2, TrendingUp, Ticket, Package, Mail } from 'lucide-react';
import Link from 'next/link';

export default async function CRMPage() {
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

  // Obtener estadísticas básicas del CRM
  let crmStats = {
    contacts: 0,
    companies: 0,
    deals: 0,
    tickets: 0,
  };

  try {
    const { data: stats } = await supabase.rpc('crm.get_stats', {
      org_id_param: orgResult.organization.id,
    });
    if (stats) {
      crmStats = {
        contacts: stats.total_contacts || 0,
        companies: stats.total_companies || 0,
        deals: stats.total_deals || 0,
        tickets: stats.total_tickets || 0,
      };
    }
  } catch (error) {
    // Si no existe la función, usar valores por defecto
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus contactos, empresas, deals y tickets
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactos</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.contacts}</div>
            <Link
              href="/dashboard/crm/contacts"
              className="text-xs text-muted-foreground hover:underline"
            >
              Ver todos
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.companies}</div>
            <Link
              href="/dashboard/crm/companies"
              className="text-xs text-muted-foreground hover:underline"
            >
              Ver todas
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.deals}</div>
            <Link
              href="/dashboard/crm/deals"
              className="text-xs text-muted-foreground hover:underline"
            >
              Ver todos
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmStats.tickets}</div>
            <Link
              href="/dashboard/crm/tickets"
              className="text-xs text-muted-foreground hover:underline"
            >
              Ver todos
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
          <CardDescription>Navega rápidamente a las secciones del CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col p-4" asChild>
              <Link href="/dashboard/crm/contacts">
                <Contact className="mb-2 h-6 w-6" />
                <span>Contactos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col p-4" asChild>
              <Link href="/dashboard/crm/companies">
                <Building2 className="mb-2 h-6 w-6" />
                <span>Empresas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col p-4" asChild>
              <Link href="/dashboard/crm/deals">
                <TrendingUp className="mb-2 h-6 w-6" />
                <span>Deals</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col p-4" asChild>
              <Link href="/dashboard/crm/tickets">
                <Ticket className="mb-2 h-6 w-6" />
                <span>Tickets</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col p-4" asChild>
              <Link href="/dashboard/crm/products">
                <Package className="mb-2 h-6 w-6" />
                <span>Productos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col p-4" asChild>
              <Link href="/dashboard/communications/email/campaigns">
                <Mail className="mb-2 h-6 w-6" />
                <span>Campañas</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

