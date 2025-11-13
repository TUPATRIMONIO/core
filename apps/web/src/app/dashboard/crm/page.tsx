/**
 * Dashboard Principal del CRM
 * Vista general con KPIs y actividad reciente
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StatsCard } from '@/components/crm/StatsCard';
import { 
  Users, 
  Building2, 
  Briefcase, 
  Ticket, 
  DollarSign,
  Mail,
  TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency, formatRelativeTime } from '@/lib/crm/helpers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Dashboard CRM - TuPatrimonio',
  description: 'Panel de control del sistema CRM',
};

export default async function CRMDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar acceso al CRM
  const { data: canAccess } = await supabase.rpc('can_access_crm', {
    user_id: user.id
  });

  if (!canAccess) {
    redirect('/dashboard');
  }

  // Obtener organization_id
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
    redirect('/dashboard');
  }

  // Obtener estadísticas
  const { data: stats } = await supabase
    .schema('crm')
    .rpc('get_stats', { org_id: orgUser.organization_id });

  const crmStats = stats || {
    total_contacts: 0,
    total_companies: 0,
    new_contacts: 0,
    active_deals: 0,
    open_tickets: 0,
    deals_value: 0,
    unread_emails: 0
  };

  // Obtener actividad reciente
  const { data: recentActivities } = await supabase
    .schema('crm')
    .from('activities')
    .select(`
      *,
      contact:contacts(id, full_name, email),
      company:companies(id, name),
      performed_by_user:users!activities_performed_by_fkey(id, first_name, last_name)
    `)
    .eq('organization_id', orgUser.organization_id)
    .order('performed_at', { ascending: false })
    .limit(10);

  // Obtener deals próximos a cerrar
  const { data: upcomingDeals } = await supabase
    .schema('crm')
    .from('deals')
    .select(`
      *,
      contact:contacts(id, full_name),
      company:companies(id, name)
    `)
    .eq('organization_id', orgUser.organization_id)
    .not('stage', 'in', '(closed_won,closed_lost)')
    .not('expected_close_date', 'is', null)
    .order('expected_close_date', { ascending: true })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard CRM
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tus contactos, empresas y oportunidades de venta
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/crm/contacts">
          <StatsCard
            title="Contactos"
            value={crmStats.total_contacts}
            icon={Users}
            description={`${crmStats.new_contacts} nuevos esta semana`}
          />
        </Link>

        <Link href="/dashboard/crm/companies">
          <StatsCard
            title="Empresas"
            value={crmStats.total_companies}
            icon={Building2}
          />
        </Link>

        <Link href="/dashboard/crm/deals">
          <StatsCard
            title="Negocios Activos"
            value={crmStats.active_deals}
            icon={Briefcase}
            description={formatCurrency(crmStats.deals_value)}
          />
        </Link>

        <Link href="/dashboard/crm/tickets">
          <StatsCard
            title="Tickets Abiertos"
            value={crmStats.open_tickets}
            icon={Ticket}
            description={crmStats.open_tickets > 0 ? 'Requieren atención' : 'Todo al día'}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline de Ventas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Pipeline de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeals && upcomingDeals.length > 0 ? (
                <>
                  {upcomingDeals.map((deal: any) => (
                    <Link 
                      key={deal.id} 
                      href={`/dashboard/crm/deals/${deal.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {deal.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {deal.company?.name || deal.contact?.full_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(deal.value || 0)}
                        </p>
                        {deal.expected_close_date && (
                          <p className="text-xs text-gray-500">
                            Cierre: {new Date(deal.expected_close_date).toLocaleDateString('es-CL')}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                  <Link href="/dashboard/crm/deals">
                    <Button variant="ghost" className="w-full">
                      Ver todos los negocios →
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay negocios activos
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities && recentActivities.length > 0 ? (
                <>
                  {recentActivities.map((activity: any) => (
                    <div 
                      key={activity.id}
                      className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.subject || activity.type}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.contact?.full_name || activity.company?.name}
                          {activity.performed_by_user && ` · ${activity.performed_by_user.first_name}`}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(activity.performed_at)}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay actividad reciente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/crm/contacts/new">
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Nuevo Contacto
              </Button>
            </Link>
            <Link href="/dashboard/crm/companies/new">
              <Button variant="outline" className="w-full">
                <Building2 className="w-4 h-4 mr-2" />
                Nueva Empresa
              </Button>
            </Link>
            <Link href="/dashboard/crm/deals/new">
              <Button variant="outline" className="w-full">
                <Briefcase className="w-4 h-4 mr-2" />
                Nuevo Negocio
              </Button>
            </Link>
            <Link href="/dashboard/crm/tickets/new">
              <Button variant="outline" className="w-full">
                <Ticket className="w-4 h-4 mr-2" />
                Nuevo Ticket
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


