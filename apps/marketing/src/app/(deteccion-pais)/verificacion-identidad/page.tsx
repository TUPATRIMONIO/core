'use client'

import { CountryRedirect } from '@/components/CountryRedirect';
import { Shield } from "lucide-react";

export default function VerificacionIdentidadRedirect() {
  return (
    <CountryRedirect
      icon={Shield}
      title="Verificación de Identidad"
      description="KYC y verificación biométrica específica para cada país con sus documentos oficiales y regulaciones locales."
      servicePath="verificacion-identidad"
    />
  );
}