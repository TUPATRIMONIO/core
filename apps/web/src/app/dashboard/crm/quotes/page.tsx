/**
 * Lista de Cotizaciones CRM
 * Vista de todas las cotizaciones enviadas
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
import { FileText, Plus, Search } from 'lucide-react';
import type { Quote, QuoteStatus } from '@/types/crm';
import { formatCurrency, formatRelativeTime } from '@/lib/crm/helpers';

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadQuotes();
  }, [statusFilter, search]);

  async function loadQuotes() {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/crm/quotes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const result = await response.json();
      setQuotes(result.data || []);
      setTotal(result.count || 0);
    } catch (error) {
      console.error('Error loading quotes:', error);
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
            Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'cotización' : 'cotizaciones'} en total
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/crm/quotes/new')}
          className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cotización
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
                  placeholder="Buscar cotizaciones..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="viewed">Vista</SelectItem>
                <SelectItem value="accepted">Aceptada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Cotizaciones */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Cargando cotizaciones...
            </div>
          ) : quotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No hay cotizaciones"
              description="Crea tu primera cotización para enviar a clientes"
              actionLabel="Nueva Cotización"
              onAction={() => router.push('/dashboard/crm/quotes/new')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Válida Hasta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow 
                    key={quote.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => router.push(`/dashboard/crm/quotes/${quote.id}`)}
                  >
                    <TableCell>
                      <code className="font-mono text-sm font-medium">
                        {quote.quote_number}
                      </code>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {quote.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-700 dark:text-gray-300">
                        {quote.company?.name || quote.contact?.full_name || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(quote.total, quote.currency)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="quote" value={quote.status as QuoteStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {quote.valid_until 
                        ? new Date(quote.valid_until).toLocaleDateString('es-CL')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/quotes/${quote.id}`);
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



