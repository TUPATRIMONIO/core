import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Product } from '@/types/crm';
import { formatCurrency } from '@/lib/crm/helpers';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Obtener organización del usuario
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
    notFound();
  }

  // Obtener producto
  const { data: product, error } = await supabase
    .from('crm.products')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgUser.organization_id)
    .single();

  if (error || !product) {
    notFound();
  }

  const productData = product as Product;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{productData.name}</h1>
            <p className="text-muted-foreground mt-2">
              {productData.sku || 'Sin SKU'}
            </p>
          </div>
        </div>
        <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Link href={`/dashboard/crm/products/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{productData.name}</p>
            </div>
            {productData.sku && (
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-medium">{productData.sku}</p>
              </div>
            )}
            {productData.category && (
              <div>
                <p className="text-sm text-muted-foreground">Categoría</p>
                <p className="font-medium">{productData.category}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={productData.is_active ? 'default' : 'secondary'}>
                {productData.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            {productData.description && (
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="text-sm">{productData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Financiera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="text-2xl font-bold">
                {formatCurrency(productData.price, productData.currency)}
              </p>
            </div>
            {productData.cost && (
              <div>
                <p className="text-sm text-muted-foreground">Costo</p>
                <p className="font-medium">
                  {formatCurrency(productData.cost, productData.currency)}
                </p>
                {productData.price > productData.cost && (
                  <p className="text-sm text-green-600">
                    Margen: {formatCurrency(productData.price - productData.cost, productData.currency)}
                    {' '}
                    ({((productData.price - productData.cost) / productData.price * 100).toFixed(1)}%)
                  </p>
                )}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Facturación</p>
              <p className="font-medium capitalize">
                {productData.billing_type === 'one_time' ? 'Una Vez' :
                 productData.billing_type === 'recurring' ? 'Recurrente' :
                 productData.billing_type === 'usage_based' ? 'Basado en Uso' :
                 productData.billing_type}
              </p>
            </div>
            {productData.billing_frequency && (
              <div>
                <p className="text-sm text-muted-foreground">Frecuencia</p>
                <p className="font-medium capitalize">
                  {productData.billing_frequency === 'monthly' ? 'Mensual' :
                   productData.billing_frequency === 'quarterly' ? 'Trimestral' :
                   productData.billing_frequency === 'yearly' ? 'Anual' :
                   productData.billing_frequency}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Creado:</span>
            <span>{new Date(productData.created_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Última actualización:</span>
            <span>{new Date(productData.updated_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



