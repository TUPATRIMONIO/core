/**
 * Catálogo de Productos CRM
 * Lista de productos/servicios para cotizaciones
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/crm/EmptyState';
import { Package, Plus, Search } from 'lucide-react';
import type { Product } from '@/types/crm';
import { formatCurrency } from '@/lib/crm/helpers';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadProducts();
  }, [search]);

  async function loadProducts() {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(`/api/crm/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();
      setProducts(result.data || []);
      setTotal(result.count || 0);
    } catch (error) {
      console.error('Error loading products:', error);
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
            Catálogo de Productos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'producto' : 'productos'} en el catálogo
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/crm/products/new')}
          className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, SKU o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Productos */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Cargando productos...
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No hay productos"
              description="Agrega productos al catálogo para usarlos en cotizaciones"
              actionLabel="Crear Producto"
              onAction={() => router.push('/dashboard/crm/products/new')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {product.sku || '-'}
                      </code>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {product.category || '-'}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(product.price, product.currency)}
                      </p>
                      {product.billing_type === 'recurring' && product.billing_frequency && (
                        <p className="text-xs text-gray-500">
                          /{product.billing_frequency === 'monthly' ? 'mes' : product.billing_frequency === 'yearly' ? 'año' : product.billing_frequency}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {product.billing_type === 'one_time' ? 'Único' : 
                         product.billing_type === 'recurring' ? 'Recurrente' :
                         product.billing_type === 'usage_based' ? 'Por Uso' : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/products/${product.id}/edit`);
                        }}
                      >
                        Editar
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

