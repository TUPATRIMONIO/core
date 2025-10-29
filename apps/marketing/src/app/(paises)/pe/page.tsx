import type { Metadata } from "next";
import { ComingSoonCountry } from "@/components/ComingSoonCountry";

export const metadata: Metadata = {
  title: "TuPatrimonio Perú - Servicios Legales Digitales | Próximamente",
  description: "Servicios legales digitales próximamente en Perú: firma electrónica válida, verificación de identidad KYC, notaría digital. Lanzamiento Q3 2025.",
  keywords: ["firma electrónica perú", "kyc perú", "notaría digital perú", "firma digital perú", "servicios legales digitales perú"],
  openGraph: {
    title: "TuPatrimonio Perú - Servicios Legales Digitales | Próximamente",
    description: "Firma electrónica y servicios legales digitales próximamente disponibles en Perú.",
    url: "https://tupatrimonio.app/pe",
    locale: "es_PE",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/pe",
    languages: {
      'es-CL': '/cl',
      'es-PE': '/pe',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PeruPage() {
  return (
    <ComingSoonCountry
      countryCode="pe"
      countryName="Perú"
      countryFlag="🇵🇪"
      launchDate="Q3 2025"
    />
  );
}

