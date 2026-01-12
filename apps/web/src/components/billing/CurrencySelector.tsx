'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { CurrencySelectorDropdown } from '@/components/shared/CurrencySelectorDropdown';
import { useGlobalCurrencyOptional } from '@/providers/GlobalCurrencyProvider';

export function CurrencySelector() {
  const currencyContext = useGlobalCurrencyOptional();
  const currentCurrency = currencyContext?.currency || 'USD';
  const currencyInfo = currencyContext?.currencyInfo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Moneda para Pagos
        </CardTitle>
        <CardDescription>
          Selecciona la moneda que se usará para todos tus pagos. 
          Es independiente del país de servicios y facturación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Moneda</label>
          <div className="flex items-center gap-2">
            <CurrencySelectorDropdown variant="full" />
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Moneda independiente:</strong> La moneda seleccionada se aplicará a todos los pagos, 
            independientemente del país de servicios o el tipo de documento de facturación.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Métodos de pago:</strong> Podrás pagar con tarjetas de crédito o débito 
            a través de Stripe o dLocalGo, que aceptan múltiples monedas y métodos de pago internacionales.
          </p>
        </div>

        {currencyInfo && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Moneda actual: <strong>{currencyInfo.symbol} {currencyInfo.code}</strong> - {currencyInfo.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
