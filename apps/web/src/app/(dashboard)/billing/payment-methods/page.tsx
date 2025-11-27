import { getBillingOverviewAction } from '@/lib/billing/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Trash2, Star, StarOff } from 'lucide-react';
import Link from 'next/link';
import { PaymentMethodsList } from '@/components/billing/PaymentMethodsList';
import { AddPaymentMethodDialog } from '@/components/billing/AddPaymentMethodDialog';

export default async function PaymentMethodsPage() {
  const overview = await getBillingOverviewAction();
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Pago</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus tarjetas y métodos de pago guardados
          </p>
        </div>
        <Button asChild>
          <Link href="/billing">
            ← Volver
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tarjetas Guardadas</CardTitle>
              <CardDescription>
                Agrega o elimina métodos de pago para tus compras
              </CardDescription>
            </div>
            <AddPaymentMethodDialog />
          </div>
        </CardHeader>
        <CardContent>
          <PaymentMethodsList initialMethods={overview.paymentMethods} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
          <CardDescription>Preguntas frecuentes sobre métodos de pago</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">¿Cómo funciona el método predeterminado?</h4>
            <p className="text-sm text-muted-foreground">
              El método predeterminado se utilizará automáticamente para compras y auto-recargas.
              Puedes cambiar el método predeterminado en cualquier momento.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">¿Es seguro guardar mi tarjeta?</h4>
            <p className="text-sm text-muted-foreground">
              Sí, utilizamos Stripe, un proveedor certificado PCI-DSS nivel 1. 
              Nunca almacenamos tu información de tarjeta completa en nuestros servidores.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

