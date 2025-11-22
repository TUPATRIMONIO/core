'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

interface Transaction {
  id: string;
  amount: number;
  service_code?: string;
  application_code?: string;
  description?: string;
}

interface UsageBreakdownProps {
  transactions: Transaction[];
}

export function UsageBreakdown({ transactions }: UsageBreakdownProps) {
  // Agrupar por servicio
  const serviceBreakdown = useMemo(() => {
    const groups: Record<string, { amount: number; count: number; name: string }> = {};
    
    transactions.forEach((transaction) => {
      const serviceKey = transaction.service_code || transaction.application_code || 'other';
      const serviceName = getServiceName(transaction.service_code, transaction.application_code);
      
      if (!groups[serviceKey]) {
        groups[serviceKey] = {
          amount: 0,
          count: 0,
          name: serviceName,
        };
      }
      
      groups[serviceKey].amount += parseFloat(transaction.amount.toString());
      groups[serviceKey].count += 1;
    });
    
    return Object.entries(groups)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalAmount = serviceBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose por Servicio</CardTitle>
        <CardDescription>
          Distribución de créditos consumidos por tipo de servicio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serviceBreakdown.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay datos de uso disponibles
          </div>
        ) : (
          <div className="space-y-4">
            {serviceBreakdown.map((item) => {
              const percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count} {item.count === 1 ? 'uso' : 'usos'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
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
        )}
      </CardContent>
    </Card>
  );
}

function getServiceName(serviceCode?: string, applicationCode?: string): string {
  const serviceNames: Record<string, string> = {
    'ai_chat_message': 'Mensaje de Chat IA',
    'ai_chat_message_kb': 'Mensaje con Base de Conocimiento',
    'ai_document_review_page': 'Revisión de Página',
    'ai_document_review_full': 'Revisión Completa de Documento',
    'ai_document_compare': 'Comparación de Documentos',
    'ai_customer_service': 'Servicio al Cliente IA',
    'ai_document_review': 'Revisión de Documentos IA',
  };
  
  if (serviceCode && serviceNames[serviceCode]) {
    return serviceNames[serviceCode];
  }
  
  if (applicationCode && serviceNames[applicationCode]) {
    return serviceNames[applicationCode];
  }
  
  return serviceCode || applicationCode || 'Otro servicio';
}

