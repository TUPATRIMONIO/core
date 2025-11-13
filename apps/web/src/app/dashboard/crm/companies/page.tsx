/**
 * Lista de Empresas CRM
 * Vista de todas las empresas/organizaciones cliente
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
import { Building2, Plus, Search, Globe, Users, Briefcase } from 'lucide-react';
import type { Company, CompanyType } from '@/types/crm';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCompanies();
  }, [typeFilter, search]);

  async function loadCompanies() {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/crm/companies?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const result = await response.json();
      setCompanies(result.data || []);
      setTotal(result.count || 0);
    } catch (error) {
      console.error('Error loading companies:', error);
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
            Empresas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'empresa' : 'empresas'} en total
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/crm/companies/new')}
          className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, dominio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por tipo */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="prospect">Prospecto</SelectItem>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="vendor">Proveedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Empresas */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Cargando empresas...
            </div>
          ) : companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No hay empresas"
              description="Comienza agregando tu primera empresa al CRM"
              actionLabel="Crear Empresa"
              onAction={() => router.push('/dashboard/crm/companies/new')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Industria</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow 
                    key={company.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => router.push(`/dashboard/crm/companies/${company.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {company.name}
                        </p>
                        {company.domain && (
                          <p className="text-sm text-gray-500">
                            {company.domain}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.website ? (
                        <a 
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[var(--tp-brand)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="w-4 h-4" />
                          <span className="text-sm">Visitar</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        type="company" 
                        value={company.type as CompanyType} 
                      />
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {company.industry || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/companies/${company.id}`);
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



