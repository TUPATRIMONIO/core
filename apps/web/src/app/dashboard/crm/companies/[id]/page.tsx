/**
 * Detalle de Empresa CRM
 * Vista completa con contactos, deals y tickets
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/crm/StatusBadge';
import { StatsCard } from '@/components/crm/StatsCard';
import { 
  ArrowLeft,
  Globe, 
  Mail, 
  Phone,
  MapPin,
  Users,
  Briefcase,
  Ticket,
  DollarSign,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import type { Company, CompanyType } from '@/types/crm';
import { formatCurrency, formatRelativeTime } from '@/lib/crm/formatters';
import { resolveActiveOrganizationId } from '@/lib/organizations/server';

export const metadata: Metadata = {
  title: 'Detalle de Empresa - CRM',
};

export default async function CompanyDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: canAccess } = await supabase.rpc('can_access_crm', { user_id: user.id });
  if (!canAccess) redirect('/dashboard');

  const { organizationId, needsSelection } = await resolveActiveOrganizationId(supabase, user.id);

  if (needsSelection) redirect('/dashboard/select-organization');
  if (!organizationId) redirect('/dashboard');

  // Obtener empresa
  const { data: company, error } = await supabase
    .schema('crm')
    .from('companies')
    .select(`
      *,
      parent_company:companies!companies_parent_company_id_fkey(id, name, domain),
      assigned_user:users!companies_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
    `)
    .eq('id', params.id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !company) redirect('/dashboard/crm/companies');

  // Obtener estadísticas de la empresa
  const { data: stats } = await supabase
    .schema('crm')
    .rpc('get_company_stats', { company_uuid: params.id });

  const companyStats = stats || {
    contact_count: 0,
    active_deals: 0,
    open_tickets: 0,
    total_revenue: 0
  };

  // Obtener contactos de la empresa
  const { data: contacts } = await supabase
    .schema('crm')
    .from('contacts')
    .select('id, full_name, email, job_title, status')
    .eq('company_id', params.id)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Obtener deals de la empresa
  const { data: deals } = await supabase
    .schema('crm')
    .from('deals')
    .select('id, title, value, currency, stage, contact:contacts(id, full_name)')
    .eq('company_id', params.id)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false})
    .limit(10);

  // Obtener tickets de la empresa
  const { data: tickets } = await supabase
    .schema('crm')
    .from('tickets')
    .select('id, ticket_number, subject, status, priority')
    .eq('company_id', params.id)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/companies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {company.name}
          </h1>
          {company.domain && (
            <p className="text-gray-600 dark:text-gray-400">{company.domain}</p>
          )}
        </div>
        <StatusBadge type="company" value={company.type as CompanyType} />
        <Link href={`/dashboard/crm/companies/${company.id}/edit`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      {/* KPIs de la Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Contactos"
          value={companyStats.contact_count}
          icon={Users}
        />
        <StatsCard
          title="Negocios Activos"
          value={companyStats.active_deals}
          icon={Briefcase}
        />
        <StatsCard
          title="Tickets Abiertos"
          value={companyStats.open_tickets}
          icon={Ticket}
        />
        <StatsCard
          title="Revenue Total"
          value={companyStats.total_revenue}
          icon={DollarSign}
          format="currency"
          currency={company.currency || 'CLP'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                      <a 
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--tp-brand)] hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                )}

                {company.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <a 
                        href={`mailto:${company.email}`}
                        className="text-[var(--tp-brand)] hover:underline"
                      >
                        {company.email}
                      </a>
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                      <a 
                        href={`tel:${company.phone}`}
                        className="text-gray-900 dark:text-gray-100"
                      >
                        {company.phone}
                      </a>
                    </div>
                  </div>
                )}

                {company.city && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {company.city}{company.country && `, ${company.country}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contactos de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Contactos ({companyStats.contact_count})</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((contact: any) => (
                    <Link 
                      key={contact.id}
                      href={`/dashboard/crm/contacts/${contact.id}`}
                      className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {contact.full_name || contact.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {contact.job_title || 'Sin cargo'}
                          </p>
                        </div>
                        <StatusBadge type="contact" value={contact.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No hay contactos en esta empresa
                </p>
              )}
            </CardContent>
          </Card>

          {/* Deals de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Negocios ({companyStats.active_deals})</CardTitle>
            </CardHeader>
            <CardContent>
              {deals && deals.length > 0 ? (
                <div className="space-y-3">
                  {deals.map((deal: any) => (
                    <Link 
                      key={deal.id}
                      href={`/dashboard/crm/deals/${deal.id}`}
                      className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {deal.title}
                          </p>
                          {deal.contact && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {deal.contact.full_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(deal.value || 0, deal.currency)}
                          </p>
                          <StatusBadge type="deal" value={deal.stage} className="text-xs" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No hay negocios activos
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {company.industry && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Industria</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {company.industry}
                  </p>
                </div>
              )}
              {company.company_size && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Tamaño</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {company.company_size} empleados
                  </p>
                </div>
              )}
              {company.annual_revenue && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Revenue Anual</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(company.annual_revenue, company.currency)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500 dark:text-gray-400">Creado</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatRelativeTime(company.created_at)}
                </p>
              </div>
              {company.assigned_user && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Account Manager</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {company.assigned_user.first_name} {company.assigned_user.last_name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets de la Empresa */}
          {tickets && tickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tickets Recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tickets.map((ticket: any) => (
                  <Link 
                    key={ticket.id}
                    href={`/dashboard/crm/tickets/${ticket.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {ticket.ticket_number}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {ticket.subject}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}



