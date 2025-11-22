import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Calendar, CreditCard, Building2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InvoiceDetail } from '@/components/billing/InvoiceDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Obtener organización del usuario
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    notFound();
  }
  
  // Obtener factura con line items (usar vista pública)
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      line_items:invoice_line_items (*),
      payments:payments (*)
    `)
    .eq('id', id)
    .eq('organization_id', orgUser.organization_id)
    .single();
  
  if (invoiceError || !invoice) {
    notFound();
  }
  
  // Obtener información de la organización
  const { data: org } = await supabase
    .from('organizations')
    .select('name, email, address, tax_id')
    .eq('id', orgUser.organization_id)
    .single();
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      open: 'secondary',
      cancelled: 'outline',
      overdue: 'destructive',
    };

    const labels: Record<string, string> = {
      paid: 'Pagada',
      open: 'Abierta',
      cancelled: 'Cancelada',
      overdue: 'Vencida',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit_purchase: 'Compra de Créditos',
      subscription: 'Suscripción',
      auto_recharge: 'Auto-Recarga',
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Factura {invoice.invoice_number}</h1>
            <p className="text-muted-foreground mt-2">
              {getTypeLabel(invoice.type)}
            </p>
          </div>
        </div>
        <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <a href={`/api/billing/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Ver/Descargar PDF
          </a>
        </Button>
      </div>
      
      {/* Información de la factura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información de la Factura</CardTitle>
            {getStatusBadge(invoice.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Fecha de emisión</span>
              </div>
              <p className="font-medium">
                {new Date(invoice.created_at).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {invoice.due_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de vencimiento</span>
                </div>
                <p className="font-medium">
                  {new Date(invoice.due_date).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {invoice.paid_at && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>Fecha de pago</span>
                </div>
                <p className="font-medium">
                  {new Date(invoice.paid_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Información de la organización */}
      {org && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de Facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{org.name}</p>
              {org.email && <p className="text-sm text-muted-foreground">{org.email}</p>}
              {org.address && <p className="text-sm text-muted-foreground">{org.address}</p>}
              {org.tax_id && <p className="text-sm text-muted-foreground">RUT: {org.tax_id}</p>}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Detalle de la factura */}
      <InvoiceDetail invoice={invoice} />
      
      {/* Información de pagos */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagos</CardTitle>
            <CardDescription>Historial de pagos asociados a esta factura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{payment.provider}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: payment.currency,
                      }).format(payment.amount)}
                    </p>
                    <Badge variant={payment.status === 'succeeded' ? 'default' : 'secondary'}>
                      {payment.status === 'succeeded' ? 'Completado' : payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

