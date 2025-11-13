/**
 * Detalle de Cotización CRM
 * Vista completa de cotización con line items
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/crm/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Building2,
  User,
  Calendar,
  FileText,
  Mail,
  Edit,
  Download
} from 'lucide-react';
import Link from 'next/link';
import type { Quote, QuoteStatus } from '@/types/crm';
import { formatCurrency, formatRelativeTime } from '@/lib/crm/helpers';

export const metadata: Metadata = {
  title: 'Detalle de Cotización - CRM',
};

export default async function QuoteDetailPage({
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

  // Obtener cotización con line items
  const { data: quote, error } = await supabase
    .schema('crm')
    .from('quotes')
    .select(`
      *,
      contact:contacts(id, full_name, email, phone),
      company:companies(id, name, domain, email, phone, address, city, country),
      deal:deals(id, title, stage),
      assigned_user:users!quotes_assigned_to_fkey(id, first_name, last_name, email),
      line_items:quote_line_items(
        *,
        product:products(id, name, sku)
      )
    `)
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single();

  if (error || !quote) redirect('/dashboard/crm/quotes');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/quotes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {quote.quote_number}
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {quote.title}
          </p>
        </div>
        <StatusBadge type="quote" value={quote.status as QuoteStatus} />
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
        {quote.status === 'draft' && (
          <Link href={`/dashboard/crm/quotes/${quote.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.company && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <Link 
                      href={`/dashboard/crm/companies/${quote.company.id}`}
                      className="font-medium text-[var(--tp-brand)] hover:underline"
                    >
                      {quote.company.name}
                    </Link>
                    {quote.company.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {quote.company.address}, {quote.company.city}, {quote.company.country}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {quote.contact && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <Link 
                      href={`/dashboard/crm/contacts/${quote.contact.id}`}
                      className="text-[var(--tp-brand)] hover:underline"
                    >
                      {quote.contact.full_name}
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quote.contact.email} {quote.contact.phone && ` · ${quote.contact.phone}`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items de la Cotización */}
          <Card>
            <CardHeader>
              <CardTitle>Items de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto/Servicio</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.line_items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </p>
                          )}
                          {item.product?.sku && (
                            <p className="text-xs text-gray-400 mt-1">
                              SKU: {item.product.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price, quote.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.line_total, quote.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totales */}
              <div className="mt-6 space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(quote.subtotal, quote.currency)}</span>
                </div>
                {quote.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Impuestos:</span>
                    <span>{formatCurrency(quote.tax_amount, quote.currency)}</span>
                  </div>
                )}
                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                    <span className="text-red-600">-{formatCurrency(quote.discount_amount, quote.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-2xl text-[var(--tp-brand)]">
                    {formatCurrency(quote.total, quote.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Términos de Pago */}
          {quote.payment_terms && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Términos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {quote.payment_terms}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Acciones */}
          {quote.status === 'draft' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                  disabled
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Requiere integración Gmail
                </p>
              </CardContent>
            </Card>
          )}

          {/* Detalles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {quote.valid_until && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Válida Hasta</span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {new Date(quote.valid_until).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}

              {quote.deal && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Negocio Relacionado</p>
                  <Link 
                    href={`/dashboard/crm/deals/${quote.deal.id}`}
                    className="text-[var(--tp-brand)] hover:underline"
                  >
                    {quote.deal.title}
                  </Link>
                </div>
              )}

              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Creado</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatRelativeTime(quote.created_at)}
                </p>
              </div>

              {quote.sent_at && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Enviado</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatRelativeTime(quote.sent_at)}
                  </p>
                </div>
              )}

              {quote.viewed_at && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Visto por Cliente</p>
                  <p className="text-green-600 dark:text-green-400">
                    {formatRelativeTime(quote.viewed_at)}
                  </p>
                </div>
              )}

              {quote.accepted_at && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Aceptado</p>
                  <p className="text-green-600 dark:text-green-400 font-semibold">
                    {formatRelativeTime(quote.accepted_at)}
                  </p>
                </div>
              )}

              {quote.assigned_user && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Asignado a</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {quote.assigned_user.first_name} {quote.assigned_user.last_name}
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


