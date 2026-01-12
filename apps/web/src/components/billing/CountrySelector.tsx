'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, DollarSign } from 'lucide-react';
import { updateOrganizationCountryAction } from '@/lib/billing/actions';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrencyForCountrySync } from '@/lib/pricing/countries-sync';

interface CountrySelectorProps {
  currentCountry: string;
}

const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CL', name: 'Chile' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'PE', name: 'Perú' },
  { code: 'BR', name: 'Brasil' },
];

const LATAM_COUNTRIES = ['CL', 'AR', 'CO', 'MX', 'PE'];

export function CountrySelector({ currentCountry }: CountrySelectorProps) {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(currentCountry);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setError(null);
    setSuccess(false);
  };

  const handleSave = () => {
    if (selectedCountry === currentCountry) {
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await updateOrganizationCountryAction(selectedCountry);
        setSuccess(true);
        router.refresh();
        
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } catch (err: any) {
        setError(err.message || 'Error al actualizar el país');
      }
    });
  };

  const isLATAM = LATAM_COUNTRIES.includes(selectedCountry);
  const currentCountryInfo = COUNTRIES.find(c => c.code === currentCountry);
  const selectedCountryInfo = COUNTRIES.find(c => c.code === selectedCountry);
  const currentCurrency = getCurrencyForCountrySync(currentCountry);
  const selectedCurrency = getCurrencyForCountrySync(selectedCountry);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          País de Facturación
        </CardTitle>
        <CardDescription>
          El país determina el tipo de documento de facturación y la moneda de pago. 
          La moneda está asociada automáticamente al país seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">País</label>
          <Select
            value={selectedCountry}
            onValueChange={handleCountryChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un país" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => {
                const currency = getCurrencyForCountrySync(country.code);
                return (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center justify-between w-full">
                      <span>{country.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({currency})</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Mostrar moneda asociada */}
        <div className="rounded-lg border border-[var(--tp-lines-30)] bg-[var(--tp-background-light)] dark:bg-[var(--tp-background-dark)] p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Moneda asociada</p>
              <p className="text-sm font-semibold">
                {selectedCurrency} - {selectedCountryInfo?.name}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            La moneda se establece automáticamente según el país y no puede modificarse manualmente.
          </p>
        </div>

        {selectedCountry !== currentCountry && (
          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Cambio detectado:</strong> Estás cambiando de{' '}
              <strong>{currentCountryInfo?.name}</strong> a{' '}
              <strong>{selectedCountryInfo?.name}</strong>.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              Esto afectará el tipo de documento de facturación disponible y cambiará la moneda de{' '}
              <strong>{currentCurrency}</strong> a <strong>{selectedCurrency}</strong>.
            </p>
          </div>
        )}

        <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-900/20">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Reglas de facturación:</strong>
          </p>
          <ul className="text-xs text-purple-700 dark:text-purple-300 mt-2 space-y-1 list-disc list-inside">
            <li>Para todas las organizaciones: Invoice con Stripe (por defecto)</li>
            <li>Organizaciones business de Chile: Pueden seleccionar Boleta o Factura Electrónica</li>
            <li>La moneda está asociada automáticamente al país seleccionado</li>
          </ul>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>
              País actualizado correctamente. Los cambios se reflejarán en la próxima compra.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSave}
          disabled={isPending || selectedCountry === currentCountry}
          className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

