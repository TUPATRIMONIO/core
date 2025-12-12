'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BillingDataForm, { type BasicBillingData } from './BillingDataForm';

interface ZeroAmountCheckoutFormProps {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  countryCode?: string;
}

export default function ZeroAmountCheckoutForm({
  orderId,
  orderAmount,
  orderCurrency,
  countryCode = 'CL',
}: ZeroAmountCheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<BasicBillingData | null>(null);

  const handleConfirmOrder = async () => {
    if (!billingData) {
      setError('Por favor completa los datos de facturación (requerido para el registro)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Guardar datos de facturación antes de confirmar
      try {
        const billingToSave = {
          tax_id: billingData.tax_id,
          name: billingData.name,
          email: billingData.email || '',
          document_type: 'none', // No generar factura
        };
        
        await fetch('/api/billing/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billing_data: billingToSave }),
        });
      } catch (err) {
        console.warn('Error guardando datos de facturación:', err);
      }

      // Procesar orden gratuita
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId,
          provider: 'free',
          returnUrl: `${window.location.origin}/checkout/${orderId}/success`,
          document_type: 'none', // Importante: indicar explícitamente que no se requiere factura
          billing_data: {
            tax_id: billingData.tax_id,
            name: billingData.name,
            email: billingData.email || '',
            document_type: 'none',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      // Redirigir a éxito
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback si no hay URL (no debería pasar con nuestra lógica)
        router.refresh();
      }

    } catch (err: any) {
      console.error('Error confirmando pedido gratuito:', err);
      setError(err.message || 'Error al confirmar el pedido');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BillingDataForm
        countryCode={countryCode}
        onDataChange={setBillingData}
        title="Datos de Registro"
        description="Ingresa tus datos para el registro del pedido"
        hideAlert={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>Confirmar Pedido Gratuito</CardTitle>
          <CardDescription>
            Este pedido no tiene costo. Confirma para activar tu servicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900">Total a pagar</span>
              <span className="text-2xl font-bold text-green-700">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: orderCurrency,
                }).format(orderAmount)}
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Bonificación del 100% aplicada
            </p>
          </div>

          <Button
            onClick={handleConfirmOrder}
            disabled={loading || !billingData}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar Pedido
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
