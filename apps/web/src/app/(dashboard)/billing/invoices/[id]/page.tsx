import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, Building2, FileCode } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
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
  
  // Obtener documento (usar invoicing.documents)
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgUser.organization_id)
    .single();
  
  if (docError || !document) {
    notFound();
  }
  
  // Obtener items del documento si existen
  const { data: items } = await supabase
    .from('document_items')
    .select('*')
    .eq('document_id', id)
    .order('id');
  
  // Obtener información de la organización
  const { data: org } = await supabase
    .from('organizations')
    .select('name, email, address, tax_id')
    .eq('id', orgUser.organization_id)
    .single();
  
  // Obtener información del cliente
  const { data: customer } = document.customer_id ? await supabase
    .from('customers')
    .select('*')
    .eq('id', document.customer_id)
    .single() : { data: null };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      issued: 'default',
      pending: 'secondary',
      processing: 'outline',
      failed: 'destructive',
      voided: 'outline',
    };

    const labels: Record<string, string> = {
      issued: 'Emitido',
      pending: 'Pendiente',
      processing: 'Procesando',
      failed: 'Fallido',
      voided: 'Anulado',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      factura_electronica: 'Factura Electrónica',
      boleta_electronica: 'Boleta Electrónica',
      stripe_invoice: 'Stripe Invoice',
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency || 'CLP',
      minimumFractionDigits: currency === 'CLP' ? 0 : 2,
    }).format(amount);
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
            <h1 className="text-3xl font-bold">Documento {document.document_number}</h1>
            <p className="text-muted-foreground mt-2">
              {getDocumentTypeLabel(document.document_type)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {document.pdf_url && (
            <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              <a href={document.pdf_url} target="_blank" rel="noopener noreferrer nofollow">
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </a>
            </Button>
          )}
          {document.xml_url && (
            <Button asChild variant="outline">
              <a href={document.xml_url} target="_blank" rel="noopener noreferrer nofollow">
                <FileCode className="mr-2 h-4 w-4" />
                Descargar XML
              </a>
            </Button>
          )}
        </div>
      </div>
      
      {/* Información del documento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información del Documento</CardTitle>
            {getStatusBadge(document.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Fecha de creación</span>
              </div>
              <p className="font-medium">
                {new Date(document.created_at).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {document.issued_at && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de emisión</span>
                </div>
                <p className="font-medium">
                  {new Date(document.issued_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Proveedor</span>
              </div>
              <p className="font-medium capitalize">{document.provider}</p>
            </div>
            {document.external_id && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>ID Externo</span>
                </div>
                <p className="font-mono text-sm">{document.external_id}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Información del receptor */}
      {customer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Receptor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{customer.name}</p>
              {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
              {customer.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
              {customer.tax_id && <p className="text-sm text-muted-foreground">RUT: {customer.tax_id}</p>}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Detalle de items */}
      {items && items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.quantity} × {formatCurrency(item.unit_price, document.currency)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.total, document.currency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Totales */}
      <Card>
        <CardHeader>
          <CardTitle>Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(document.subtotal, document.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuesto</span>
              <span>{formatCurrency(document.tax, document.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(document.total, document.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
