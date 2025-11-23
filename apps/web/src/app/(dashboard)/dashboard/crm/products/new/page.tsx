import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateProductForm } from '@/components/crm/CreateProductForm';

export default async function NewProductPage() {
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
            <h1 className="text-3xl font-bold">Nuevo Producto</h1>
            <p className="text-muted-foreground mt-2">
              Crea un nuevo producto en tu catálogo
            </p>
          </div>
        </div>
      </div>

      <CreateProductForm />
    </div>
  );
}



