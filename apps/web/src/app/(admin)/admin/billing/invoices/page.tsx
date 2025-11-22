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
import { Receipt } from 'lucide-react';
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

async function getInvoices() {
  const supabase = createServiceRoleClient();

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return invoices || [];
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    paid: 'bg-green-50 text-green-700',
    open: 'bg-yellow-50 text-yellow-700',
    draft: 'bg-gray-50 text-gray-700',
    void: 'bg-red-50 text-red-700',
    uncollectible: 'bg-red-50 text-red-700',
  };

  return (
    <Badge variant="outline" className={variants[status] || ''}>
      {status === 'paid' ? 'Pagada' : 
       status === 'open' ? 'Abierta' :
       status === 'draft' ? 'Borrador' :
       status === 'void' ? 'Anulada' :
       status === 'uncollectible' ? 'Incobrable' : status}
    </Badge>
  );
}

export default async function AdminInvoicesPage() {
  const invoices = await getInvoices();

  const totalPaid = invoices
    .filter((inv: any) => inv.status === 'paid')
    .reduce((sum, inv: any) => sum + Number(inv.total || 0), 0);
  
  const totalOpen = invoices
    .filter((inv: any) => inv.status === 'open')
    .reduce((sum, inv: any) => sum + Number(inv.total || 0), 0);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Facturas"
        description="Gestiona las facturas de todas las organizaciones"
      />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Pagado</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid, 'CLP')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Pendiente</div>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalOpen, 'CLP')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de facturas */}
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Receipt}
                title="No hay facturas"
                description="Aún no se han creado facturas en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Organización</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.organization?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{invoice.organization?.slug || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.type === 'credit_purchase' ? 'Compra de Créditos' :
                         invoice.type === 'subscription' ? 'Suscripción' :
                         invoice.type === 'one_time' ? 'Pago Único' : invoice.type}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.created_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/organizations/${invoice.organization_id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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

