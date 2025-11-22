import { createServiceRoleClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/admin/empty-state';
import { Contact } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, Users, TrendingUp, Ticket } from 'lucide-react';

async function getCRMStats() {
  const supabase = createServiceRoleClient();

  // Obtener estadísticas de CRM usando función RPC
  // La función crm.get_stats requiere org_id, pero podemos obtener stats globales
  // consultando todas las organizaciones
  try {
    // Obtener todas las organizaciones primero
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .limit(100);

    if (!orgs || orgs.length === 0) {
      return { contacts: 0, companies: 0, deals: 0, tickets: 0 };
    }

    // Sumar stats de todas las organizaciones
    let totalContacts = 0;
    let totalCompanies = 0;
    let totalDeals = 0;
    let totalTickets = 0;

    // Usar función RPC para cada organización (limitamos a las primeras 10 para performance)
    for (const org of orgs.slice(0, 10)) {
      try {
        const { data: stats } = await supabase.rpc('crm.get_stats', {
          org_id_param: org.id,
        });

        if (stats) {
          totalContacts += stats.total_contacts || 0;
          totalCompanies += stats.total_companies || 0;
          totalDeals += stats.total_deals || 0;
          totalTickets += stats.total_tickets || 0;
        }
      } catch (error) {
        // Continuar con siguiente org si hay error
        continue;
      }
    }

    return {
      contacts: totalContacts,
      companies: totalCompanies,
      deals: totalDeals,
      tickets: totalTickets,
    };
  } catch (error) {
    console.error('Error fetching CRM stats:', error);
    // Retornar valores por defecto si hay error
    return {
      contacts: 0,
      companies: 0,
      deals: 0,
      tickets: 0,
    };
  }
}

export default async function AdminCRMPage() {
  const stats = await getCRMStats();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="CRM"
        description="Vista general del CRM de todas las organizaciones"
      />

      <div className="flex-1 px-4 pb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Contactos</div>
                  <div className="text-2xl font-bold">{stats.contacts}</div>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Empresas</div>
                  <div className="text-2xl font-bold">{stats.companies}</div>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Deals</div>
                  <div className="text-2xl font-bold">{stats.deals}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tickets</div>
                  <div className="text-2xl font-bold">{stats.tickets}</div>
                </div>
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <EmptyState
              icon={Contact}
              title="Gestión de CRM"
              description="Accede a las secciones del CRM desde el dashboard de cada organización"
            />
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href="/admin/organizations">Ver Organizaciones</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

