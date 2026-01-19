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
import { Ticket, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DiscountCode = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  currency: string | null;
  usage_limit_type: 'single_use' | 'per_user' | 'global_limit' | 'unlimited';
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

async function getDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching discount codes:', error);
    return [];
  }

  return (data || []) as DiscountCode[];
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(amount);
}

function getUsageLabel(code: DiscountCode) {
  switch (code.usage_limit_type) {
    case 'single_use':
      return `${code.current_uses}/1`;
    case 'global_limit':
      return `${code.current_uses}/${code.max_uses ?? '-'}`;
    default:
      return `${code.current_uses}`;
  }
}

function getStatusBadge(code: DiscountCode) {
  const now = new Date();
  const validFrom = code.valid_from ? new Date(code.valid_from) : null;
  const validUntil = code.valid_until ? new Date(code.valid_until) : null;

  const isWithinWindow =
    (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);

  if (!code.is_active) {
    return <Badge variant="outline">Inactivo</Badge>;
  }

  if (!isWithinWindow) {
    return <Badge variant="outline" className="text-amber-600">Fuera de vigencia</Badge>;
  }

  return <Badge className="bg-green-50 text-green-700">Activo</Badge>;
}

export default async function AdminDiscountsPage() {
  const discountCodes = await getDiscountCodes();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Cupones"
        description="Crea y administra códigos de descuento para el checkout"
        actions={(
          <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]" asChild>
            <a href="/admin/billing/discounts/new">
              <Plus className="h-4 w-4" />
              <span className="ml-2">Crear cupón</span>
            </a>
          </Button>
        )}
      />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {discountCodes.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Ticket}
                title="Aún no hay cupones"
                description="Crea tu primer código para ofrecer descuentos"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code}</TableCell>
                      <TableCell className="capitalize">
                        {code.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                      </TableCell>
                      <TableCell>
                        {code.type === 'percentage'
                          ? `${code.value}%`
                          : formatCurrency(Number(code.value), code.currency || 'CLP')}
                      </TableCell>
                      <TableCell>{getUsageLabel(code)}</TableCell>
                      <TableCell>{getStatusBadge(code)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/admin/billing/discounts/${code.id}`}>
                            <Pencil className="h-4 w-4" />
                          </a>
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

