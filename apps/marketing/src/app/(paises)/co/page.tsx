import type { Metadata } from "next";
import { ComingSoonCountry } from "@/components/ComingSoonCountry";

export const metadata: Metadata = {
  title: "TuPatrimonio Colombia - Servicios Legales Digitales | Próximamente",
  description: "Servicios legales digitales próximamente en Colombia: firma electrónica válida según Ley 527, verificación de identidad KYC, notaría digital. Lanzamiento Q2 2025.",
  keywords: ["firma electrónica colombia", "kyc colombia", "notaría digital colombia", "ley 527 colombia", "servicios legales digitales colombia"],
  openGraph: {
    title: "TuPatrimonio Colombia - Servicios Legales Digitales | Próximamente",
    description: "Firma electrónica y servicios legales digitales próximamente disponibles en Colombia. Cumplimiento Ley 527.",
    url: "https://tupatrimonio.app/co",
    locale: "es_CO",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/co",
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

export default function ColombiaPage() {
  return (
    <ComingSoonCountry
      countryCode="co"
      countryName="Colombia"
      countryFlag="🇨🇴"
      launchDate="Q2 2025"
    />
  );
}
