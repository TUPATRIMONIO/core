/**
 * Lista de Deals/Negocios CRM
 * Vista de pipeline de ventas
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/crm/StatusBadge';
import { EmptyState } from '@/components/crm/EmptyState';
import { Briefcase, Plus, Search, TrendingUp } from 'lucide-react';
import type { Deal, DealStage } from '@/types/crm';
import { formatCurrency, formatRelativeTime } from '@/lib/crm/formatters';

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    loadDeals();
  }, [stageFilter, search]);

  async function loadDeals() {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (stageFilter !== 'all') params.append('stage', stageFilter);
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(`/api/crm/deals?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }

      const result = await response.json();
      const dealsData = result.data || [];
      setDeals(dealsData);
      setTotal(result.count || 0);
      
      // Calcular valor total
      const sum = dealsData.reduce((acc: number, deal: Deal) => acc + (deal.value || 0), 0);
      setTotalValue(sum);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Negocios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'negocio' : 'negocios'} · Valor total: {formatCurrency(totalValue)}
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/crm/deals/new')}
          className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Negocio
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar negocios..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todos los stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los stages</SelectItem>
                <SelectItem value="prospecting">Prospección</SelectItem>
                <SelectItem value="qualification">Calificación</SelectItem>
                <SelectItem value="proposal">Propuesta</SelectItem>
                <SelectItem value="negotiation">Negociación</SelectItem>
                <SelectItem value="closed_won">Ganado</SelectItem>
                <SelectItem value="closed_lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Deals */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Cargando negocios...
            </div>
          ) : deals.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No hay negocios"
              description="Comienza creando tu primera oportunidad de venta"
              actionLabel="Crear Negocio"
              onAction={() => router.push('/dashboard/crm/deals/new')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Contacto/Empresa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Probabilidad</TableHead>
                  <TableHead>Cierre Esperado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow 
                    key={deal.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => router.push(`/dashboard/crm/deals/${deal.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {deal.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-700 dark:text-gray-300">
                        {deal.company?.name || deal.contact?.full_name || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(deal.value || 0, deal.currency)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="deal" value={deal.stage as DealStage} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-[var(--tp-brand)] h-2 rounded-full"
                            style={{ width: `${deal.probability || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {deal.probability || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {deal.expected_close_date 
                        ? new Date(deal.expected_close_date).toLocaleDateString('es-CL')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/deals/${deal.id}`);
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



