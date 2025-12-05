import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { InvoicesList } from '@/components/billing/InvoicesList';

interface PageProps {
  searchParams: Promise<{ 
    status?: string;
    type?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  
  // Obtener organización del usuario (incluye platform org para platform admins)
  const { getUserActiveOrganization } = await import('@/lib/organization/utils');
  const orgResult = await getUserActiveOrganization(supabase);

  if (!orgResult.organization) {
    return (
      <div className="container mx-auto py-8">
        <p>No se encontró organización</p>
      </div>
    );
  }
  
  // Construir query para documentos tributarios (invoicing.documents)
  let query = supabase
    .from('documents')
    .select('*')
    .eq('organization_id', orgResult.organization.id)
    .order('created_at', { ascending: false });
  
  // Aplicar filtros
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  
  if (params.type && params.type !== 'all') {
    query = query.eq('document_type', params.type);
  }
  
  if (params.search) {
    query = query.ilike('document_number', `%${params.search}%`);
  }
  
  // Paginación
  const page = parseInt(params.page || '1');
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data: documents, error } = await query.range(from, to);
  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgResult.organization.id);
  
  const totalPages = Math.ceil((count || 0) / pageSize);
  
  // Transformar documentos al formato esperado por InvoicesList
  const invoices = (documents || []).map((doc: any) => ({
    id: doc.id,
    invoice_number: doc.document_number,
    status: doc.status === 'issued' ? 'paid' : doc.status === 'voided' ? 'void' : doc.status,
    type: doc.document_type === 'stripe_invoice' ? 'invoice' : doc.document_type,
    total: doc.total,
    currency: doc.currency,
    created_at: doc.created_at,
    pdf_url: doc.pdf_url,
  }));
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos Tributarios</h1>
          <p className="text-muted-foreground mt-2">
            Historial de facturas, boletas y documentos emitidos
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/billing">
            ← Volver
          </Link>
        </Button>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Buscar por número..."
                  defaultValue={params.search}
                  className="pl-9"
                />
              </div>
            </div>
            <Select name="status" defaultValue={params.status || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="issued">Emitido</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="voided">Anulado</SelectItem>
              </SelectContent>
            </Select>
            <Select name="type" defaultValue={params.type || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="factura_electronica">Factura Electrónica</SelectItem>
                <SelectItem value="boleta_electronica">Boleta Electrónica</SelectItem>
                <SelectItem value="stripe_invoice">Stripe Invoice</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full md:w-auto bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              Aplicar Filtros
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Lista de documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            {count || 0} documento{(count || 0) !== 1 ? 's' : ''} encontrado{(count || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesList 
            invoices={invoices} 
            currentPage={page}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
