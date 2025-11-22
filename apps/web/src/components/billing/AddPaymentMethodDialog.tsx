'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, CreditCard, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Crear SetupIntent al montar
  React.useEffect(() => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/stripe/setup-intent', {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error creando sesión');
        }

        setClientSecret(data.client_secret);
      } catch (err: any) {
        setError(err.message || 'Error al inicializar');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Elemento de tarjeta no encontrado');
      setLoading(false);
      return;
    }

    try {
      // Confirmar SetupIntent
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message || 'Error procesando la tarjeta');
        return;
      }

      if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
        // Guardar método de pago
        const saveResponse = await fetch('/api/stripe/payment-methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_method_id: setupIntent.payment_method as string,
            set_as_default: false, // No marcar como default automáticamente
          }),
        });

        if (!saveResponse.ok) {
          const data = await saveResponse.json();
          throw new Error(data.error || 'Error guardando método de pago');
        }

        // Método de pago agregado correctamente
        onSuccess();
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Error procesando la tarjeta');
    } finally {
      setLoading(false);
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
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--tp-buttons)]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-md p-4 bg-background">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Guardar Tarjeta
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function AddPaymentMethodDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Método de Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Método de Pago</DialogTitle>
          <DialogDescription>
            Ingresa los datos de tu tarjeta. Tu información está protegida y encriptada.
          </DialogDescription>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <AddPaymentMethodForm onSuccess={handleSuccess} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}

