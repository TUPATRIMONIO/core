'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeCheckoutProps {
  packageId: string;
  packageName: string;
  creditsAmount: number;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function CheckoutForm({
  packageId,
  packageName,
  creditsAmount,
  amount,
  currency,
  onSuccess,
  onError,
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Crear Payment Intent al montar el componente
  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packageId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error creando sesión de pago');
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || 'Error al inicializar el pago');
        onError?.(err.message);
      } finally {
        setLoading(false);
      }
    }

    createPaymentIntent();
  }, [packageId, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Elemento de tarjeta no encontrado');
      setProcessing(false);
      return;
    }

    try {
      // Confirmar pago con 3D Secure si es necesario
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message || 'Error procesando el pago');
        onError?.(confirmError.message || 'Error procesando el pago');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Pago exitoso
        onSuccess?.();
        // Redirigir a página de éxito
        router.push(`/billing/purchase-credits/success?payment_intent=${paymentIntent.id}`);
      } else {
        setError('El pago no se completó correctamente');
        onError?.('El pago no se completó correctamente');
      }
    } catch (err: any) {
      setError(err.message || 'Error procesando el pago');
      onError?.(err.message || 'Error procesando el pago');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--tp-buttons)]" />
          <span className="ml-2">Inicializando pago...</span>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'No se pudo inicializar el pago. Por favor, intenta de nuevo.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de Pago</CardTitle>
          <CardDescription>
            Ingresa los datos de tu tarjeta para completar la compra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md p-4 bg-background">
            <CardElement options={cardElementOptions} />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total a pagar</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {creditsAmount.toLocaleString()} créditos
              </p>
            </div>
            <Button
              type="submit"
              disabled={!stripe || processing}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar Ahora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  );
}

