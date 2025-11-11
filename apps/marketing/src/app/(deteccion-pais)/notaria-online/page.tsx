'use client'

import { CountryRedirect } from '@/components/CountryRedirect';
import { Stamp } from "lucide-react";

export default function NotariaOnlineRedirect() {
  return (
    <CountryRedirect
      icon={Stamp}
      title="Notaría Online"
      description="Servicios notariales online adaptados a la legislación y código civil de cada país."
      servicePath="notaria-online"
    />
  );
}