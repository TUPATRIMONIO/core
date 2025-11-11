'use client'

import { CountryRedirect } from '@/components/CountryRedirect';
import { DollarSign } from "lucide-react";

export default function PreciosRedirect() {
  return (
    <CountryRedirect
      icon={DollarSign}
      title={<>Precios <span className="text-[var(--tp-brand)]">TuPatrimonio</span></>}
      description="Precios específicos para cada país en moneda local con planes adaptados al mercado."
      servicePath="precios"
      countries={[
        {
          code: 'cl',
          label: 'Chile - Precios en CLP',
          flag: '🇨🇱',
          href: '/cl',
          available: true
        },
        {
          code: 'ar',
          label: 'Argentina - Próximamente ARS',
          flag: '🇦🇷',
          href: '/ar',
          available: false
        },
        {
          code: 'co',
          label: 'Colombia - Próximamente COP',
          flag: '🇨🇴',
          href: '/co',
          available: false
        },
        {
          code: 'mx',
          label: 'México - Próximamente MXN',
          flag: '🇲🇽',
          href: '/mx',
          available: false
        },
        {
          code: 'pe',
          label: 'Perú - Próximamente PEN',
          flag: '🇵🇪',
          href: '/pe',
          available: false
        }
      ]}
    />
  );
}