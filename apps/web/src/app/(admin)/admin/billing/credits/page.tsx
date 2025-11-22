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
import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

async function getCreditAccounts() {
  const supabase = createServiceRoleClient();

  const { data: accounts, error } = await supabase
    .from('credit_accounts')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching credit accounts:', error);
    return [];
  }

  return accounts || [];
}

export default async function AdminCreditsPage() {
  const accounts = await getCreditAccounts();

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
  const totalReserved = accounts.reduce((sum, acc) => sum + Number(acc.reserved_balance || 0), 0);
  const totalAvailable = totalBalance - totalReserved;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Créditos"
        description="Gestiona los créditos de todas las organizaciones"
      />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Balance Total</div>
              <div className="text-2xl font-bold">{totalBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Disponible</div>
              <div className="text-2xl font-bold text-green-600">{totalAvailable.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Reservado</div>
              <div className="text-2xl font-bold text-orange-600">{totalReserved.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de cuentas */}
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Wallet}
                title="No hay cuentas de créditos"
                description="Aún no se han creado cuentas de créditos en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organización</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead>Reservado</TableHead>
                    <TableHead>Auto-Recarga</TableHead>
                    <TableHead>Total Ganado</TableHead>
                    <TableHead>Total Gastado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account: any) => {
                    const available = Number(account.balance || 0) - Number(account.reserved_balance || 0);
                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{account.organization?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{account.organization?.slug || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{Number(account.balance || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{available.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-600">{Number(account.reserved_balance || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          {account.auto_recharge_enabled ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="outline">Inactiva</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{Number(account.total_earned || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{Number(account.total_spent || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/organizations/${account.organization_id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

