'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CreditCard, Zap } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  service_code?: string;
  application_code?: string;
  created_at: string;
}

interface CreditAccount {
  balance: number;
  total_spent: number;
  total_earned: number;
}

interface UsageStatsProps {
  transactions: Transaction[];
  account?: CreditAccount;
  period: 'day' | 'week' | 'month';
}

export function UsageStats({ transactions, account, period }: UsageStatsProps) {
  // Calcular estadísticas
  const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const transactionCount = transactions.length;
  
  // Calcular promedio diario según período
  let daysInPeriod = 1;
  switch (period) {
    case 'day':
      daysInPeriod = 7;
      break;
    case 'week':
      daysInPeriod = 30;
      break;
    case 'month':
      daysInPeriod = 180; // 6 meses
      break;
  }
  
  const averageDaily = daysInPeriod > 0 ? totalSpent / daysInPeriod : 0;
  
  // Proyección mensual
  const monthlyProjection = averageDaily * 30;
  
  // Tasa de consumo (créditos por día)
  const consumptionRate = averageDaily;
  
  // Días restantes estimados (si hay balance)
  const daysRemaining = account?.balance && consumptionRate > 0 
    ? Math.floor(account.balance / consumptionRate) 
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Gastado</p>
              <p className="text-2xl font-bold mt-1">
                {totalSpent.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {transactionCount} transacciones
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-[var(--tp-buttons-20)] flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-[var(--tp-buttons)]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Promedio Diario</p>
              <p className="text-2xl font-bold mt-1">
                {averageDaily.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                créditos/día
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Proyección Mensual</p>
              <p className="text-2xl font-bold mt-1">
                {monthlyProjection.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                créditos estimados
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Días Restantes</p>
              <p className="text-2xl font-bold mt-1">
                {daysRemaining !== null ? daysRemaining : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {account?.balance ? `con ${account.balance.toFixed(2)} créditos` : 'Sin balance'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

