import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { UsageStats } from '@/components/billing/UsageStats';
import { UsageChart } from '@/components/billing/UsageChart';
import { UsageBreakdown } from '@/components/billing/UsageBreakdown';

interface PageProps {
  searchParams: Promise<{ 
    period?: 'day' | 'week' | 'month';
    start?: string;
    end?: string;
  }>;
}

export default async function UsagePage({ searchParams }: PageProps) {
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
  
  // Calcular fechas según período
  const period = params.period || 'month';
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  
  switch (period) {
    case 'day':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7); // Últimos 7 días
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30); // Últimas 4 semanas
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6); // Últimos 6 meses
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
  }
  
  // Obtener transacciones de créditos gastados (usar vista pública)
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('organization_id', orgResult.organization.id)
    .eq('type', 'spent')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });
  
  // Obtener cuenta de créditos para estadísticas (usar vista pública)
  const { data: account } = await supabase
    .from('credit_accounts')
    .select('*')
    .eq('organization_id', orgResult.organization.id)
    .single();
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Uso de Créditos</h1>
            <p className="text-muted-foreground mt-2">
              Analiza tu consumo de créditos y proyecciones
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/billing/usage/export?period=${period}`}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </a>
        </Button>
      </div>
      
      {/* Estadísticas rápidas */}
      <UsageStats 
        transactions={transactions || []} 
        account={account}
        period={period}
      />
      
      {/* Gráfico de uso */}
      <UsageChart 
        transactions={transactions || []}
        period={period}
      />
      
      {/* Breakdown por servicio */}
      <UsageBreakdown 
        transactions={transactions || []}
      />
    </div>
  );
}

