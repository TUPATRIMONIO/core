import { createServiceRoleClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/admin/empty-state';
import { DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
// Función helper para formatear moneda
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency === 'CLP' ? 'CLP' : currency === 'USD' ? 'USD' : 'CLP',
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(amount);
}

async function getPayments() {
  const supabase = createServiceRoleClient();

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices (
        id,
        invoice_number,
        organization_id,
        organization:organizations (
          id,
          name,
          slug
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  return payments || [];
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    succeeded: 'bg-green-50 text-green-700',
    pending: 'bg-yellow-50 text-yellow-700',
    processing: 'bg-blue-50 text-blue-700',
    failed: 'bg-red-50 text-red-700',
    refunded: 'bg-gray-50 text-gray-700',
  };

  return (
    <Badge variant="outline" className={variants[status] || ''}>
      {status === 'succeeded' ? 'Exitoso' : 
       status === 'pending' ? 'Pendiente' :
       status === 'processing' ? 'Procesando' :
       status === 'failed' ? 'Fallido' :
       status === 'refunded' ? 'Reembolsado' : status}
    </Badge>
  );
}

export default async function AdminPaymentsPage() {
  const payments = await getPayments();

  const totalSucceeded = payments
    .filter((p: any) => p.status === 'succeeded')
    .reduce((sum, p: any) => sum + Number(p.amount || 0), 0);
  
  const totalFailed = payments
    .filter((p: any) => p.status === 'failed')
    .reduce((sum, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Pagos"
        description="Gestiona los pagos de todas las organizaciones"
      />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Exitoso</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSucceeded, 'CLP')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Fallido</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalFailed, 'CLP')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de pagos */}
        {payments.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={DollarSign}
                title="No hay pagos"
                description="Aún no se han registrado pagos en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Organización</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.invoice?.organization?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{payment.invoice?.organization?.slug || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.invoice?.invoice_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.provider}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.invoice?.organization_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/organizations/${payment.invoice.organization_id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

