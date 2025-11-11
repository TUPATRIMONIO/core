'use client'

import { CountryRedirect } from '@/components/CountryRedirect';
import { FileSignature } from "lucide-react";

export default function FirmasElectronicasLanding() {
  return (
    <CountryRedirect
      icon={FileSignature}
      title="Firma Electrónica"
      description="Firma documentos legales de forma digital con validez jurídica completa en cada país."
      servicePath="firmas-electronicas"
    />
  );
}