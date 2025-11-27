'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/checkout/core';

interface OrderCheckoutFormProps {
  orderId: string;
  order: Order;
  provider: 'transbank' | 'stripe';
}

export default function OrderCheckoutForm({
  orderId,
  order,
  provider,
}: OrderCheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      if (provider === 'transbank') {
        const returnUrl = `${window.location.origin}/billing/purchase-credits/success?provider=transbank&orderId=${orderId}`;
        
        const response = await fetch('/api/transbank/checkout/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            orderId,
            returnUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error creando pago');
        }

        // Redirigir a Transbank
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No se recibió URL de redirección');
        }
      } else {
        // Stripe
        const response = await fetch('/api/stripe/checkout/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error creando sesión de pago');
        }

        // Redirigir a página de confirmación de Stripe o procesar pago
        if (data.clientSecret) {
          // Aquí deberías integrar Stripe Elements para procesar el pago
          // Por ahora redirigimos a una página de éxito
          router.push(`/billing/purchase-credits/success?provider=stripe&orderId=${orderId}`);
        } else {
          throw new Error('No se recibió client secret');
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">
              Método de pago: {provider === 'transbank' ? 'Transbank' : 'Stripe'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {provider === 'transbank' 
                ? 'Serás redirigido a Transbank para completar el pago de forma segura.'
                : 'Completa el pago con tu tarjeta de crédito o débito.'}
            </p>
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: order.currency,
                }).format(order.amount)}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

