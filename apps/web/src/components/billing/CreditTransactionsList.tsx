'use client';

import { useCreditTransactions } from '@/hooks/billing/useCredits';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, Coins } from 'lucide-react';

export function CreditTransactionsList() {
  const { activeOrganization } = useOrganization();
  const { transactions, loading } = useCreditTransactions(activeOrganization?.id || '', 50);

  if (!activeOrganization) return null;

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Cargando movimientos...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center border rounded-lg bg-muted/50">
        <Coins className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No hay movimientos registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const isIncome = ['earned', 'released', 'refunded'].includes(tx.type);
            
            return (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">
                  {format(new Date(tx.created_at), 'dd MMM, yyyy HH:mm', { locale: es })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{tx.description || 'Sin descripción'}</span>
                    {tx.service_code && (
                      <span className="text-xs text-muted-foreground">
                        {tx.service_code}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isIncome ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={isIncome ? 'default' : 'secondary'}>
                      {tx.type}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className={`text-right font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {parseFloat(tx.balance_after).toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
