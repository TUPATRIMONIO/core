import type { Metadata } from "next";
import { ComingSoonCountry } from "@/components/ComingSoonCountry";

export const metadata: Metadata = {
  title: "TuPatrimonio México - Servicios Legales Digitales | Próximamente",
  description: "Servicios legales digitales próximamente en México: firma electrónica válida según NOM-151, modificaciones de empresa, notaría digital. Lanzamiento Q2 2025.",
  keywords: ["firma electrónica méxico", "modificaciones de empresa méxico", "notaría digital méxico", "NOM-151-SCFI", "servicios legales digitales méxico"],
  openGraph: {
    title: "TuPatrimonio México - Servicios Legales Digitales | Próximamente",
    description: "Firma electrónica y servicios legales digitales próximamente disponibles en México. Cumplimiento NOM-151.",
    url: "https://tupatrimonio.app/mx",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/mx",
    languages: {
      'es-CL': '/cl',
      'es-CO': '/co', 
      'es-MX': '/mx',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MexicoPage() {
  return (
    <ComingSoonCountry
      countryCode="mx"
      countryName="México"
      countryFlag="🇲🇽"
      launchDate="Q2 2025"
    />
  );
}
