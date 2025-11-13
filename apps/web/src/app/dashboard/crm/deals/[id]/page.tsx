/**
 * Detalle de Deal/Negocio CRM
 * Vista completa con timeline y cotizaciones
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/crm/StatusBadge';
import { 
  ArrowLeft,
  Building2,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  Edit,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import type { Deal, DealStage } from '@/types/crm';
import { formatCurrency, formatRelativeTime } from '@/lib/crm/helpers';

export const metadata: Metadata = {
  title: 'Detalle de Negocio - CRM',
};

export default async function DealDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: canAccess } = await supabase.rpc('can_access_crm', { user_id: user.id });
  if (!canAccess) redirect('/dashboard');

  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) redirect('/dashboard');

  // Obtener deal
  const { data: deal, error } = await supabase
    .schema('crm')
    .from('deals')
    .select(`
      *,
      contact:contacts(id, full_name, email, phone, company_name),
      company:companies(id, name, domain, type, website),
      assigned_user:users!deals_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
    `)
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single();

  if (error || !deal) redirect('/dashboard/crm/deals');

  // Obtener actividades del deal
  const { data: activities } = await supabase
    .schema('crm')
    .from('activities')
    .select(`
      *,
      performed_by_user:users!activities_performed_by_fkey(id, first_name, last_name)
    `)
    .eq('deal_id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .order('performed_at', { ascending: false })
    .limit(10);

  // Obtener cotizaciones del deal
  const { data: quotes } = await supabase
    .schema('crm')
    .from('quotes')
    .select('id, quote_number, title, status, total, currency')
    .eq('deal_id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/deals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {deal.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {deal.company?.name || deal.contact?.full_name}
          </p>
        </div>
        <StatusBadge type="deal" value={deal.stage as DealStage} />
        <Link href={`/dashboard/crm/deals/${deal.id}/edit`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Deal */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Valor</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(deal.value || 0, deal.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Probabilidad</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-[var(--tp-brand)] h-2 rounded-full"
                          style={{ width: `${deal.probability || 0}%` }}
                        />
                      </div>
                      <span className="text-lg font-semibold">{deal.probability || 0}%</span>
                    </div>
                  </div>
                </div>

                {deal.contact && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Contacto</p>
                      <Link 
                        href={`/dashboard/crm/contacts/${deal.contact.id}`}
                        className="text-[var(--tp-brand)] hover:underline"
                      >
                        {deal.contact.full_name}
                      </Link>
                    </div>
                  </div>
                )}

                {deal.company && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                      <Link 
                        href={`/dashboard/crm/companies/${deal.company.id}`}
                        className="text-[var(--tp-brand)] hover:underline"
                      >
                        {deal.company.name}
                      </Link>
                    </div>
                  </div>
                )}

                {deal.expected_close_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cierre Esperado</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(deal.expected_close_date).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {deal.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Descripción</p>
                  <p className="text-gray-700 dark:text-gray-300">{deal.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad del Negocio</CardTitle>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity: any) => (
                    <div 
                      key={activity.id}
                      className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {activity.subject || activity.type}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {activity.performed_by_user?.first_name} · {formatRelativeTime(activity.performed_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No hay actividades registradas
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cotizaciones */}
          {quotes && quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Cotizaciones ({quotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quotes.map((quote: any) => (
                  <Link 
                    key={quote.id}
                    href={`/dashboard/crm/quotes/${quote.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {quote.quote_number}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {quote.title} · {formatCurrency(quote.total, quote.currency)}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detalles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Fuente</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {deal.source || 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Creado</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatRelativeTime(deal.created_at)}
                </p>
              </div>
              {deal.assigned_user && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Asignado a</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {deal.assigned_user.first_name} {deal.assigned_user.last_name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


