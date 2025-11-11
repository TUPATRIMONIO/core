'use client'

import { CountryRedirect } from '@/components/CountryRedirect';
import { Building2 } from "lucide-react";

export default function ModificacionesEmpresaRedirect() {
  return (
    <CountryRedirect
      icon={Building2}
      title="Modificaciones de Empresa"
      description="Realiza modificaciones societarias de forma 100% digital: cambios de razón social, aumentos de capital, modificación de directorio y más."
      servicePath="modificaciones-empresa"
    />
  );
}

