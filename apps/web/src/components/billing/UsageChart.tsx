'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

interface Transaction {
  id: string;
  amount: number;
  created_at: string;
}

interface UsageChartProps {
  transactions: Transaction[];
  period: 'day' | 'week' | 'month';
}

export function UsageChart({ transactions, period }: UsageChartProps) {
  // Agrupar transacciones por período
  const groupedData = useMemo(() => {
    const groups: Record<string, number> = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.created_at);
      let key: string;
      
      switch (period) {
        case 'day':
          key = date.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `Semana ${weekStart.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}`;
          break;
        case 'month':
          key = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
          break;
        default:
          key = date.toLocaleDateString('es-CL');
      }
      
      groups[key] = (groups[key] || 0) + parseFloat(transaction.amount.toString());
    });
    
    return Object.entries(groups)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, period]);

  const maxAmount = Math.max(...groupedData.map(d => d.amount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso de Créditos</CardTitle>
        <CardDescription>
          Consumo de créditos en el período seleccionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groupedData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay datos de uso en este período
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gráfico de barras simple */}
            <div className="space-y-2">
              {groupedData.map((item) => {
                const percentage = (item.amount / maxAmount) * 100;
                return (
                  <div key={item.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.date}</span>
                      <span className="text-muted-foreground">
                        {item.amount.toFixed(2)} créditos
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[var(--tp-buttons)] rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

