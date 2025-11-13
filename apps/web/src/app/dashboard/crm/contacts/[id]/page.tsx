/**
 * Detalle de Contacto CRM
 * Vista completa con tabs: Timeline, Deals, Tickets
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/crm/StatusBadge';
import { EmailComposer } from '@/components/crm/EmailComposer';
import { 
  ArrowLeft,
  Mail, 
  Phone, 
  Building2,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import type { Contact, ContactStatus } from '@/types/crm';
import { formatRelativeTime } from '@/lib/crm/helpers';

export const metadata: Metadata = {
  title: 'Detalle de Contacto - CRM',
};

export default async function ContactDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar acceso
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

  // Obtener contacto
  const { data: contact, error } = await supabase
    .schema('crm')
    .from('contacts')
    .select(`
      *,
      company:companies(id, name, domain, type, website, phone, email),
      assigned_user:users!contacts_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
    `)
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single();

  if (error || !contact) {
    redirect('/dashboard/crm/contacts');
  }

  // Obtener actividades del contacto
  const { data: activities } = await supabase
    .schema('crm')
    .from('activities')
    .select(`
      *,
      performed_by_user:users!activities_performed_by_fkey(id, first_name, last_name, email)
    `)
    .eq('contact_id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .order('performed_at', { ascending: false })
    .limit(20);

  // Obtener deals del contacto
  const { data: deals } = await supabase
    .schema('crm')
    .from('deals')
    .select('id, title, value, currency, stage')
    .eq('contact_id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .order('created_at', { ascending: false });

  // Obtener tickets del contacto
  const { data: tickets } = await supabase
    .schema('crm')
    .from('tickets')
    .select('id, ticket_number, subject, status, priority')
    .eq('contact_id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {contact.full_name || 'Sin nombre'}
          </h1>
          {contact.job_title && (
            <p className="text-gray-600 dark:text-gray-400">
              {contact.job_title}
              {contact.company && ` en ${contact.company.name}`}
            </p>
          )}
        </div>
        <StatusBadge type="contact" value={contact.status as ContactStatus} />
        <Link href={`/dashboard/crm/contacts/${contact.id}/edit`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contact.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <a 
                        href={`mailto:${contact.email}`}
                        className="text-[var(--tp-brand)] hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                      <a 
                        href={`tel:${contact.phone}`}
                        className="text-gray-900 dark:text-gray-100"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}

                {contact.company && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                      <Link 
                        href={`/dashboard/crm/companies/${contact.company.id}`}
                        className="text-[var(--tp-brand)] hover:underline"
                      >
                        {contact.company.name}
                      </Link>
                    </div>
                  </div>
                )}

                {contact.city && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {contact.city}{contact.country && `, ${contact.country}`}
                      </p>
                    </div>
                  </div>
                )}

                {contact.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                      <a 
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--tp-brand)] hover:underline"
                      >
                        {contact.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {contact.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Notas</p>
                  <p className="text-gray-700 dark:text-gray-300">{contact.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline de Actividades */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
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

          {/* Email Composer */}
          {contact.email && (
            <EmailComposer 
              defaultTo={contact.email}
              defaultSubject={`Seguimiento: ${contact.full_name || contact.email}`}
              contactId={contact.id}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deals Relacionados */}
          {deals && deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Negocios ({deals.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deals.map((deal: any) => (
                  <Link 
                    key={deal.id}
                    href={`/dashboard/crm/deals/${deal.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {deal.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {deal.value && `${deal.value.toLocaleString()} ${deal.currency}`}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tickets Relacionados */}
          {tickets && tickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tickets ({tickets.length})</CardTitle>
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

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Fuente</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {contact.source || 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Creado</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatRelativeTime(contact.created_at)}
                </p>
              </div>
              {contact.assigned_user && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Asignado a</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {contact.assigned_user.first_name} {contact.assigned_user.last_name}
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

