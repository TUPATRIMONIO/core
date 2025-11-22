'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateAutoRechargeSettingsAction } from '@/lib/billing/actions';

interface PaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  is_default: boolean;
  provider: string;
}

interface CreditPackage {
  id: string;
  name: string;
  credits_amount: number;
  price_usd: number;
}

interface CreditAccount {
  auto_recharge_enabled: boolean;
  auto_recharge_threshold?: number;
  auto_recharge_amount?: number;
  auto_recharge_payment_method_id?: string;
}

interface AutoRechargeSettingsProps {
  account?: CreditAccount;
  paymentMethods: PaymentMethod[];
  packages: CreditPackage[];
}

export function AutoRechargeSettings({ account, paymentMethods, packages }: AutoRechargeSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(account?.auto_recharge_enabled || false);
  const [threshold, setThreshold] = useState(account?.auto_recharge_threshold?.toString() || '100');
  const [packageId, setPackageId] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState(account?.auto_recharge_payment_method_id || '');
  const [error, setError] = useState<string | null>(null);

  // Encontrar paquete seleccionado para mostrar cantidad de créditos
  const selectedPackage = packages.find(pkg => pkg.id === packageId);
  const rechargeAmount = selectedPackage?.credits_amount || account?.auto_recharge_amount || 0;

  const handleSave = async () => {
    setError(null);

    if (enabled) {
      if (!threshold || parseFloat(threshold) <= 0) {
        setError('El umbral debe ser mayor a 0');
        return;
      }

      if (!packageId) {
        setError('Debes seleccionar un paquete de créditos');
        return;
      }

      if (!paymentMethodId) {
        setError('Debes seleccionar un método de pago');
        return;
      }
    }

    startTransition(async () => {
      try {
        await updateAutoRechargeSettingsAction(
          enabled,
          enabled ? parseFloat(threshold) : undefined,
          enabled ? rechargeAmount : undefined,
          enabled ? paymentMethodId : undefined
        );

        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Error al guardar configuración');
      }
    });
  };

  const handlePackageChange = (newPackageId: string) => {
    setPackageId(newPackageId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Recarga de Créditos</CardTitle>
        <CardDescription>
          Configura la recarga automática cuando tus créditos estén por agotarse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle de activación */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="auto-recharge-enabled" className="text-base font-semibold">
              Activar Auto-Recarga
            </Label>
            <p className="text-sm text-muted-foreground">
              Cuando el balance de créditos baje del umbral, se recargará automáticamente
            </p>
          </div>
          <Switch
            id="auto-recharge-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            {/* Umbral de recarga */}
            <div className="space-y-2">
              <Label htmlFor="threshold">Umbral de Recarga</Label>
              <div className="relative">
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="100"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  créditos
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Se activará la recarga cuando el balance disponible sea menor a este valor
              </p>
            </div>

            {/* Selección de paquete */}
            <div className="space-y-2">
              <Label htmlFor="package">Paquete de Créditos</Label>
              <Select value={packageId} onValueChange={handlePackageChange}>
                <SelectTrigger id="package">
                  <SelectValue placeholder="Selecciona un paquete" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.credits_amount.toLocaleString()} créditos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPackage && (
                <p className="text-sm text-muted-foreground">
                  Se recargarán {selectedPackage.credits_amount.toLocaleString()} créditos
                </p>
              )}
            </div>

            {/* Método de pago */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de Pago</Label>
              {paymentMethods.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No tienes métodos de pago guardados.{' '}
                    <a href="/billing/payment-methods" className="text-[var(--tp-buttons)] underline">
                      Agregar método de pago
                    </a>
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Selecciona un método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>
                            {method.brand
                              ? `${method.brand.toUpperCase()} •••• ${method.last4 || '****'}`
                              : 'Método de pago'}
                          </span>
                          {method.is_default && (
                            <span className="text-xs text-muted-foreground">(Predeterminado)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Resumen */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Resumen:</strong> Cuando tu balance de créditos baje de{' '}
                <strong>{threshold}</strong> créditos, se recargarán automáticamente{' '}
                <strong>{rechargeAmount.toLocaleString()}</strong> créditos usando el método de
                pago seleccionado.
              </AlertDescription>
            </Alert>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botón de guardar */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || (enabled && (!packageId || !paymentMethodId))}
            className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Configuración'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

