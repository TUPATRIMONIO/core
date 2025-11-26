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
import { Loader2, Globe } from 'lucide-react';
import { updateOrganizationCountryAction } from '@/lib/billing/actions';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CountrySelectorProps {
  currentCountry: string;
}

const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos', currency: 'USD' },
  { code: 'CL', name: 'Chile', currency: 'CLP' },
  { code: 'AR', name: 'Argentina', currency: 'ARS' },
  { code: 'CO', name: 'Colombia', currency: 'COP' },
  { code: 'MX', name: 'México', currency: 'MXN' },
  { code: 'PE', name: 'Perú', currency: 'PEN' },
  { code: 'BR', name: 'Brasil', currency: 'BRL' },
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          País de Facturación
        </CardTitle>
        <CardDescription>
          Selecciona tu país para ver métodos de pago locales disponibles
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
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCountry !== currentCountry && (
          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Cambio detectado:</strong> Estás cambiando de{' '}
              <strong>{currentCountryInfo?.name}</strong> a{' '}
              <strong>{selectedCountryInfo?.name}</strong>.
              {isLATAM && (
                <>
                  {' '}Esto habilitará métodos de pago locales (dLocal Go) además de Stripe.
                </>
              )}
            </p>
          </div>
        )}

        {isLATAM && (
          <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Métodos de pago disponibles:</strong> Podrás elegir entre métodos locales
              (transferencia bancaria, efectivo) y tarjetas internacionales (Stripe).
            </p>
          </div>
        )}

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

