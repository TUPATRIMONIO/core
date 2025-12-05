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
import { Receipt, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Función helper para formatear moneda
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency === 'CLP' ? 'CLP' : currency === 'USD' ? 'USD' : 'CLP',
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(amount);
}

async function getDocuments() {
  const supabase = createServiceRoleClient();

  // Usar invoicing.documents en lugar de billing.invoices
  const { data: documents, error } = await supabase
    .from('documents')
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
    console.error('Error fetching documents:', error);
    return [];
  }

  return documents || [];
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    issued: 'bg-green-50 text-green-700',
    pending: 'bg-yellow-50 text-yellow-700',
    processing: 'bg-blue-50 text-blue-700',
    failed: 'bg-red-50 text-red-700',
    voided: 'bg-gray-50 text-gray-700',
  };

  const labels: Record<string, string> = {
    issued: 'Emitido',
    pending: 'Pendiente',
    processing: 'Procesando',
    failed: 'Fallido',
    voided: 'Anulado',
  };

  return (
    <Badge variant="outline" className={variants[status] || ''}>
      {labels[status] || status}
    </Badge>
  );
}

function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    factura_electronica: 'Factura Electrónica',
    boleta_electronica: 'Boleta Electrónica',
    stripe_invoice: 'Stripe Invoice',
  };
  return labels[type] || type;
}

export default async function AdminInvoicesPage() {
  const documents = await getDocuments();

  const totalIssued = documents
    .filter((doc: any) => doc.status === 'issued')
    .reduce((sum, doc: any) => sum + Number(doc.total || 0), 0);
  
  const totalPending = documents
    .filter((doc: any) => doc.status === 'pending' || doc.status === 'processing')
    .reduce((sum, doc: any) => sum + Number(doc.total || 0), 0);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Documentos Tributarios"
        description="Gestiona los documentos emitidos de todas las organizaciones"
      />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Emitido</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIssued, 'CLP')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Pendiente</div>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending, 'CLP')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de documentos */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Receipt}
                title="No hay documentos"
                description="Aún no se han emitido documentos tributarios en el sistema"
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
                  {documents.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.document_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{doc.organization?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{doc.organization?.slug || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getDocumentTypeLabel(doc.document_type)}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(doc.total, doc.currency)}
                      </TableCell>
                      <TableCell>
                        {new Date(doc.created_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.pdf_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.pdf_url} target="_blank" rel="noopener noreferrer">
                                PDF
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/organizations/${doc.organization_id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
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
