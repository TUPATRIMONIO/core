import type { Metadata } from "next";
import { ComingSoonCountry } from "@/components/ComingSoonCountry";

export const metadata: Metadata = {
  title: "TuPatrimonio Argentina - Servicios Legales Digitales | Próximamente",
  description: "Servicios legales digitales próximamente en Argentina: firma electrónica válida según Ley 25.506, modificaciones de empresa, notaría digital. Lanzamiento Q3 2025.",
  keywords: ["firma digital argentina", "modificaciones de empresa argentina", "notaría digital argentina", "ley 25.506", "servicios legales digitales argentina"],
  openGraph: {
    title: "TuPatrimonio Argentina - Servicios Legales Digitales | Próximamente",
    description: "Firma electrónica y servicios legales digitales próximamente disponibles en Argentina. Cumplimiento Ley 25.506.",
    url: "https://tupatrimonio.app/ar",
    locale: "es_AR",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/ar",
    languages: {
      'es-CL': '/cl',
      'es-AR': '/ar',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ArgentinaPage() {
  return (
    <ComingSoonCountry
      countryCode="ar"
      countryName="Argentina"
      countryFlag="🇦🇷"
      launchDate="Q3 2025"
    />
  );
}

