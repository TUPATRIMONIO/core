import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, Filter } from 'lucide-react';
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
  
  // Construir query (usar vista pública)
  let query = supabase
    .from('invoices')
    .select('*')
    .eq('organization_id', orgResult.organization.id)
    .order('created_at', { ascending: false });
  
  // Aplicar filtros
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  
  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type);
  }
  
  if (params.search) {
    query = query.or(`invoice_number.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }
  
  // Paginación
  const page = parseInt(params.page || '1');
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data: invoices, error } = await query.range(from, to);
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgResult.organization.id);
  
  const totalPages = Math.ceil((count || 0) / pageSize);
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturas</h1>
          <p className="text-muted-foreground mt-2">
            Historial completo de tus facturas y pagos
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
                  placeholder="Buscar por número o descripción..."
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
                <SelectItem value="open">Abierta</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
              </SelectContent>
            </Select>
            <Select name="type" defaultValue={params.type || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="credit_purchase">Compra de créditos</SelectItem>
                <SelectItem value="subscription">Suscripción</SelectItem>
                <SelectItem value="auto_recharge">Auto-recarga</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full md:w-auto">
              Aplicar Filtros
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Lista de facturas */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
          <CardDescription>
            {count || 0} factura{(count || 0) !== 1 ? 's' : ''} encontrada{(count || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesList 
            invoices={invoices || []} 
            currentPage={page}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}

