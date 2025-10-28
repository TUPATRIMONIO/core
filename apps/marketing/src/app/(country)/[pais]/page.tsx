import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, Clock, Users, MapPin, Building, Briefcase } from "lucide-react";
import Link from "next/link";
import { CountryRouteWrapper, useCountryConfig } from "@/components/CountryRouteWrapper";
import { notFound } from "next/navigation";

// Países permitidos
const ALLOWED_COUNTRIES = ['cl', 'mx', 'co', 'pe', 'ar'];

// Metadata por país
const COUNTRY_METADATA: Record<string, { title: string; description: string; keywords: string[] }> = {
  cl: {
    title: 'TuPatrimonio Chile - Servicios Legales Digitales | Firma Electrónica, KYC, Notaría',
    description: 'Servicios legales digitales en Chile: firma electrónica válida, verificación de identidad KYC, notaría digital. Cumple legislación chilena. Prueba gratis.',
    keywords: ['firma electrónica chile', 'kyc chile', 'notaría digital chile', 'documentos digitales chile', 'ley 19.799'],
  },
  mx: {
    title: 'TuPatrimonio México - Servicios Legales Digitales | Firma Electrónica Avanzada',
    description: 'Servicios legales digitales en México: firma electrónica avanzada, verificación de identidad, notaría digital. Cumple NOM-151. Prueba gratis.',
    keywords: ['firma electrónica méxico', 'fiel méxico', 'kyc méxico', 'notaría digital méxico', 'NOM-151'],
  },
  co: {
    title: 'TuPatrimonio Colombia - Servicios Legales Digitales | Firma Digital',
    description: 'Servicios legales digitales en Colombia: firma digital, verificación de identidad, notaría digital. Cumple Ley 527. Prueba gratis.',
    keywords: ['firma digital colombia', 'kyc colombia', 'notaría digital colombia', 'ley 527'],
  },
  pe: {
    title: 'TuPatrimonio Perú - Servicios Legales Digitales | Firma Digital',
    description: 'Servicios legales digitales en Perú: firma digital, verificación de identidad, notaría digital. Cumple legislación peruana. Prueba gratis.',
    keywords: ['firma digital perú', 'kyc perú', 'notaría digital perú'],
  },
  ar: {
    title: 'TuPatrimonio Argentina - Servicios Legales Digitales | Firma Digital',
    description: 'Servicios legales digitales en Argentina: firma digital, verificación de identidad, notaría digital. Cumple Ley 25.506. Prueba gratis.',
    keywords: ['firma digital argentina', 'kyc argentina', 'notaría digital argentina', 'ley 25.506'],
  },
};

type PageProps = {
  params: Promise<{ pais: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pais } = await params;
  const country = pais.toLowerCase();
  
  if (!ALLOWED_COUNTRIES.includes(country)) {
    return {
      title: 'País no disponible - TuPatrimonio',
    };
  }

  const meta = COUNTRY_METADATA[country];
  
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://tupatrimonio.app/${country}`,
      locale: `es-${country.toUpperCase()}`,
    },
    alternates: {
      canonical: `https://tupatrimonio.app/${country}`,
    },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { pais } = await params;
  const country = pais.toLowerCase();

  // Validar país
  if (!ALLOWED_COUNTRIES.includes(country)) {
    notFound();
  }

  const countryNames: Record<string, string> = {
    cl: 'Chile',
    mx: 'México',
    co: 'Colombia',
    pe: 'Perú',
    ar: 'Argentina',
  };

  const countryFlags: Record<string, string> = {
    cl: '🇨🇱',
    mx: '🇲🇽',
    co: '🇨🇴',
    pe: '🇵🇪',
    ar: '🇦🇷',
  };

  const countryLaws: Record<string, string> = {
    cl: 'Ley 19.799',
    mx: 'NOM-151',
    co: 'Ley 527',
    pe: 'Ley de Firma Digital',
    ar: 'Ley 25.506',
  };

  return (
    <CountryRouteWrapper country={country} showCountryHeader={true}>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Servicios Legales Digitales
              <span className="text-[var(--tp-brand)]"> para {countryNames[country]}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Firma electrónica con validez legal según <strong>{countryLaws[country]}</strong>, 
              verificación de identidad KYC y notaría digital. Todo cumpliendo la normativa de {countryNames[country]}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/empezar">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-4 text-lg"
                >
                  Empieza Gratis - {countryNames[country]}
                </Button>
              </Link>
              <Link href={`/${country}/precios`}>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Ver Precios
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Cumple {countryLaws[country]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Validez Legal Total</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-green-600" />
                <span>+200 empresas en {countryNames[country]}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Servicios Específicos para {countryNames[country]}
            </h2>
            <p className="text-xl text-gray-600">
              Diseñados para cumplir la legislación y necesidades del mercado de {countryNames[country]}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Electrónica */}
            <Card className="border-2 border-transparent hover:border-[var(--tp-buttons)] transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--tp-brand)]" />
                </div>
                <CardTitle className="text-2xl text-center">Firma Electrónica</CardTitle>
                <CardDescription className="text-center">
                  Cumple <strong>{countryLaws[country]}</strong>. Válida legalmente en {countryNames[country]}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Firma Simple y Avanzada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Certificada por entidades locales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>100% remoto</span>
                  </li>
                </ul>
                <Link href="/legal-tech/firma-electronica">
                  <Button variant="outline" className="w-full">
                    Ver Detalles
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* KYC */}
            <Card className="border-2 border-transparent hover:border-[var(--tp-buttons)] transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-[var(--tp-brand)]" />
                </div>
                <CardTitle className="text-2xl text-center">Verificación de Identidad</CardTitle>
                <CardDescription className="text-center">
                  KYC con documentos de {countryNames[country]}. Verificación biométrica en minutos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Biometría facial avanzada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Documentos oficiales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Cumplimiento normativo</span>
                  </li>
                </ul>
                <Link href={`/${country}/verificacion-identidad`}>
                  <Button variant="outline" className="w-full">
                    Ver KYC
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Notaría Digital */}
            <Card className="border-2 border-transparent hover:border-[var(--tp-buttons)] transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-[var(--tp-brand)]" />
                </div>
                <CardTitle className="text-2xl text-center">Notaría Digital</CardTitle>
                <CardDescription className="text-center">
                  Notarización online válida en {countryNames[country]}. Sin trámites presenciales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Copias legalizadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Protocolización notarial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span>Validez legal completa</span>
                  </li>
                </ul>
                <Link href="/legal-tech/tramites-notariales">
                  <Button variant="outline" className="w-full">
                    Ver Notaría
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Únete a la Transformación Digital en {countryNames[country]}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Más de 500 empresas en {countryNames[country]} ya digitalizaron sus procesos legales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/empezar">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
              >
                Comenzar Gratis
              </Button>
            </Link>
            <Link href={`/${country}/contacto`}>
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-white border-white hover:bg-white/10 px-8 py-4"
              >
                Hablar con Especialista
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </CountryRouteWrapper>
  );
}

