/**
 * Crear Nueva Cotización CRM
 * Compositor de cotizaciones con line items
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft, Save, Plus, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/crm';
import { formatCurrency } from '@/lib/crm/helpers';

interface LineItem {
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contact_id: searchParams.get('contact_id') || '',
    company_id: searchParams.get('company_id') || '',
    deal_id: searchParams.get('deal_id') || '',
    status: 'draft' as const,
    currency: 'CLP',
    tax_amount: '',
    discount_amount: '',
    payment_terms: '',
    valid_until: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const response = await fetch('/api/crm/products?is_active=true&limit=100');
      if (response.ok) {
        const result = await response.json();
        setProducts(result.data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  function addLineItem() {
    setLineItems([...lineItems, {
      name: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0
    }]);
  }

  function addProductToQuote(product: Product) {
    setLineItems([...lineItems, {
      product_id: product.id,
      name: product.name,
      description: product.description,
      quantity: 1,
      unit_price: product.price,
      discount_percent: 0
    }]);
  }

  function updateLineItem(index: number, field: keyof LineItem, value: any) {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function calculateLineTotal(item: LineItem): number {
    return item.quantity * item.unit_price * (1 - item.discount_percent / 100);
  }

  function calculateSubtotal(): number {
    return lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  }

  function calculateTotal(): number {
    const subtotal = calculateSubtotal();
    const tax = parseFloat(formData.tax_amount) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    return subtotal + tax - discount;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lineItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes agregar al menos un item a la cotización',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      
      const dataToSend = {
        ...formData,
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        deal_id: formData.deal_id || null,
        subtotal: subtotal,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        total: calculateTotal(),
        valid_until: formData.valid_until || null,
        line_items: lineItems
      };

      const response = await fetch('/api/crm/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error('Error al crear cotización');
      }

      const quote = await response.json();

      toast({
        title: 'Cotización creada',
        description: `${quote.quote_number} ha sido creada exitosamente`,
      });

      router.push(`/dashboard/crm/quotes/${quote.id}`);
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la cotización. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/quotes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Nueva Cotización
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea una propuesta comercial para tu cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Cotización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ej: Propuesta Servicios Legales"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="COP">COP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Válida Hasta</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => handleChange('valid_until', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items de la Cotización */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lineItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay items en la cotización
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto/Servicio</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
                        <TableHead className="w-32">Precio Unit.</TableHead>
                        <TableHead className="w-24">Desc. %</TableHead>
                        <TableHead className="w-32">Total</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.name}
                              onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                              placeholder="Nombre del item"
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={item.discount_percent}
                              onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">
                              {formatCurrency(calculateLineTotal(item), formData.currency)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Totales */}
                <div className="mt-6 space-y-2 max-w-sm ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal(), formData.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center gap-4">
                    <span className="text-gray-600 dark:text-gray-400">Impuestos:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tax_amount}
                      onChange={(e) => handleChange('tax_amount', e.target.value)}
                      className="w-32 text-right"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex justify-between text-sm items-center gap-4">
                    <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => handleChange('discount_amount', e.target.value)}
                      className="w-32 text-right"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(calculateTotal(), formData.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Términos */}
            <Card>
              <CardHeader>
                <CardTitle>Términos y Condiciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Términos de Pago</Label>
                  <Textarea
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => handleChange('payment_terms', e.target.value)}
                    rows={3}
                    placeholder="Ej: Net 30 días, 50% adelantado..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex gap-4 justify-end">
              <Link href="/dashboard/crm/quotes">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit"
                disabled={isSubmitting || lineItems.length === 0}
                className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                onClick={handleSubmit}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creando...' : 'Crear Cotización'}
              </Button>
            </div>
          </div>

          {/* Sidebar - Catálogo de Productos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Catálogo de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Click para agregar a la cotización
                </p>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProductToQuote(product)}
                      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatCurrency(product.price, product.currency)}
                        {product.sku && ` · ${product.sku}`}
                      </p>
                    </button>
                  ))}
                  {products.length === 0 && (
                    <p className="text-sm text-center text-gray-500 py-4">
                      No hay productos disponibles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}



