/**
 * Detalle de Ticket CRM
 * Vista completa del ticket de soporte
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
  Calendar,
  AlertCircle,
  Edit,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import type { Ticket as TicketType, TicketStatus, TicketPriority } from '@/types/crm';
import { formatRelativeTime } from '@/lib/crm/formatters';
import { resolveActiveOrganizationId } from '@/lib/organizations/server';

export const metadata: Metadata = {
  title: 'Detalle de Ticket - CRM',
};

export default async function TicketDetailPage({
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

  // Obtener ticket
  const { data: ticket, error } = await supabase
    .schema('crm')
    .from('tickets')
    .select(`
      *,
      contact:contacts(id, full_name, email, phone),
      company:companies(id, name, domain),
      assigned_user:users!tickets_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
    `)
    .eq('id', params.id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !ticket) redirect('/dashboard/crm/tickets');

  // Obtener actividades del ticket
  const { data: activities } = await supabase
    .schema('crm')
    .from('activities')
    .select(`
      *,
      performed_by_user:users!activities_performed_by_fkey(id, first_name, last_name)
    `)
    .eq('ticket_id', params.id)
    .eq('organization_id', organizationId)
    .order('performed_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {ticket.ticket_number}
            </h1>
            <StatusBadge type="ticket-priority" value={ticket.priority as TicketPriority} />
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {ticket.subject}
          </p>
        </div>
        <StatusBadge type="ticket-status" value={ticket.status as TicketStatus} />
        <Link href={`/dashboard/crm/tickets/${ticket.id}/edit`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Timeline de Actividades */}
          <Card>
            <CardHeader>
              <CardTitle>Historial del Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
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
          {/* Información del Ticket */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {ticket.contact && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <User className="w-4 h-4" />
                    <span>Reportado por</span>
                  </div>
                  <Link 
                    href={`/dashboard/crm/contacts/${ticket.contact.id}`}
                    className="text-[var(--tp-brand)] hover:underline"
                  >
                    {ticket.contact.full_name}
                  </Link>
                </div>
              )}

              {ticket.company && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Building2 className="w-4 h-4" />
                    <span>Empresa</span>
                  </div>
                  <Link 
                    href={`/dashboard/crm/companies/${ticket.company.id}`}
                    className="text-[var(--tp-brand)] hover:underline"
                  >
                    {ticket.company.name}
                  </Link>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Categoría</span>
                </div>
                <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">
                  {ticket.category.replace('_', ' ')}
                </p>
              </div>

              {ticket.due_date && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Vencimiento</span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(ticket.due_date).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-gray-500 dark:text-gray-400 mb-1">Creado</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatRelativeTime(ticket.created_at)}
                </p>
              </div>

              {ticket.assigned_user && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Asignado a</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {ticket.assigned_user.first_name} {ticket.assigned_user.last_name}
                  </p>
                </div>
              )}

              {ticket.resolved_at && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Resuelto</p>
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    {formatRelativeTime(ticket.resolved_at)}
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



