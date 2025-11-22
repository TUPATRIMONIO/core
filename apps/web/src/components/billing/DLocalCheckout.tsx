'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, XCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Mapeo estático de métodos de pago por país
function getAvailablePaymentMethods(countryCode: string): string[] {
  const methods: Record<string, string[]> = {
    CL: ['CARD', 'BANK_TRANSFER', 'CASH'],
    AR: ['CARD', 'BANK_TRANSFER', 'CASH'],
    CO: ['CARD', 'BANK_TRANSFER'],
    MX: ['CARD', 'BANK_TRANSFER', 'CASH'],
    PE: ['CARD', 'BANK_TRANSFER'],
  };
  return methods[countryCode.toUpperCase()] || ['CARD'];
}

interface DLocalCheckoutProps {
  packageId: string;
  packageName: string;
  creditsAmount: number;
  amount: number;
  currency: string;
  countryCode: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function DLocalCheckout({
  packageId,
  packageName,
  creditsAmount,
  amount,
  currency,
  countryCode,
  onSuccess,
  onError,
}: DLocalCheckoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  useEffect(() => {
    // Obtener métodos de pago disponibles para el país
    async function loadPaymentMethods() {
      try {
        const methods = await getAvailablePaymentMethods(countryCode);
        setAvailableMethods(methods);
        // Seleccionar tarjeta por defecto si está disponible
        if (methods.includes('CARD')) {
          setSelectedMethod('CARD');
        } else if (methods.length > 0) {
          setSelectedMethod(methods[0]);
        }
      } catch (err: any) {
        setError('Error cargando métodos de pago');
        console.error(err);
      }
    }

    loadPaymentMethods();
  }, [countryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dlocal/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          paymentMethodId: selectedMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando sesión de pago');
      }

      // Si requiere redirección, redirigir al usuario
      if (data.requiresRedirect && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        // Para métodos directos, verificar estado periódicamente
        // o esperar webhook
        onSuccess?.();
        router.push(`/billing/purchase-credits/success?dlocal_payment_id=${data.paymentId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error procesando el pago');
      onError?.(err.message || 'Error procesando el pago');
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (methodId: string): string => {
    const labels: Record<string, string> = {
      CARD: 'Tarjeta de Crédito/Débito',
      BANK_TRANSFER: 'Transferencia Bancaria',
      CASH: 'Pago en Efectivo',
    };
    return labels[methodId] || methodId;
  };

  const getPaymentMethodDescription = (methodId: string): string => {
    const descriptions: Record<string, string> = {
      CARD: 'Pago inmediato con tarjeta',
      BANK_TRANSFER: 'Serás redirigido para completar la transferencia',
      CASH: 'Serás redirigido para obtener el código de pago',
    };
    return descriptions[methodId] || '';
  };

  if (availableMethods.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              No hay métodos de pago disponibles para tu país.
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
          <CardTitle>Método de Pago</CardTitle>
          <CardDescription>
            Selecciona cómo deseas pagar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {availableMethods.map((methodId) => (
              <label
                key={methodId}
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedMethod === methodId
                    ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)]'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={methodId}
                  checked={selectedMethod === methodId}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">{getPaymentMethodLabel(methodId)}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getPaymentMethodDescription(methodId)}
                  </div>
                </div>
              </label>
            ))}
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
              disabled={!selectedMethod || loading}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {selectedMethod === 'CARD' ? (
                    <CreditCard className="mr-2 h-4 w-4" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Continuar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

