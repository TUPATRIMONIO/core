import type { Metadata } from 'next';
import { CountryRouteWrapper } from '@/components/CountryRouteWrapper';
import { CountryPricingTable } from '@/components/CountryPricingTable';
import { ComingSoonCountry } from '@/components/ComingSoonCountry';
import { getCountryConfig } from '@tupatrimonio/location';
import { notFound } from 'next/navigation';

const ALLOWED_COUNTRIES = ['cl', 'mx', 'co', 'pe', 'ar'];

type PageProps = {
  params: Promise<{ pais: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pais } = await params;
  const country = pais.toLowerCase();

  const countryNames: Record<string, string> = {
    cl: 'Chile',
    mx: 'México',
    co: 'Colombia',
    pe: 'Perú',
    ar: 'Argentina',
  };

  return {
    title: `Precios ${countryNames[country] || 'País'} - TuPatrimonio | Planes y Tarifas`,
    description: `Planes y precios de TuPatrimonio en ${countryNames[country] || 'tu país'}. Firma electrónica, KYC y notaría digital. Sin permanencia.`,
  };
}

// Precios por país
const PRICING_DATA: Record<string, any[]> = {
  cl: [
    {
      name: 'Básico',
      description: 'Ideal para freelancers y pequeñas empresas',
      price: 0,
      billingPeriod: 'month' as const,
      features: [
        { name: '5 firmas al mes', included: true },
        { name: 'Verificación básica', included: true },
        { name: 'Almacenamiento 1 GB', included: true },
        { name: 'Soporte por email', included: true },
        { name: 'API integración', included: false },
        { name: 'Soporte prioritario', included: false },
      ],
      cta: 'Comenzar Gratis',
      ctaHref: '/registrarse',
    },
    {
      name: 'Profesional',
      description: 'Para empresas en crecimiento',
      price: 29990,
      billingPeriod: 'month' as const,
      features: [
        { name: '50 firmas al mes', included: true },
        { name: 'Verificación avanzada', included: true },
        { name: 'Almacenamiento 50 GB', included: true },
        { name: 'Soporte prioritario', included: true },
        { name: 'API integración', included: true },
        { name: 'Notaría digital incluida', included: true },
      ],
      cta: 'Probar 30 días gratis',
      ctaHref: '/empezar',
      highlighted: true,
      badge: 'Más Popular',
    },
    {
      name: 'Empresa',
      description: 'Para grandes organizaciones',
      price: 99990,
      billingPeriod: 'month' as const,
      features: [
        { name: 'Firmas ilimitadas', included: true },
        { name: 'Verificaciones ilimitadas', included: true },
        { name: 'Almacenamiento ilimitado', included: true },
        { name: 'Soporte dedicado 24/7', included: true },
        { name: 'API avanzada', included: true },
        { name: 'Onboarding personalizado', included: true },
      ],
      cta: 'Contactar Ventas',
      ctaHref: '/cl/contacto',
    },
  ],
  mx: [
    {
      name: 'Básico',
      description: 'Ideal para freelancers y pequeñas empresas',
      price: 0,
      billingPeriod: 'month' as const,
      features: [
        { name: '5 firmas al mes', included: true },
        { name: 'Verificación básica', included: true },
        { name: 'Almacenamiento 1 GB', included: true },
        { name: 'Soporte por email', included: true },
        { name: 'API integración', included: false },
        { name: 'Soporte prioritario', included: false },
      ],
      cta: 'Comenzar Gratis',
      ctaHref: '/registrarse',
    },
    {
      name: 'Profesional',
      description: 'Para empresas en crecimiento',
      price: 899,
      billingPeriod: 'month' as const,
      features: [
        { name: '50 firmas al mes', included: true },
        { name: 'Verificación avanzada', included: true },
        { name: 'Almacenamiento 50 GB', included: true },
        { name: 'Soporte prioritario', included: true },
        { name: 'API integración', included: true },
        { name: 'Notaría digital incluida', included: true },
      ],
      cta: 'Probar 30 días gratis',
      ctaHref: '/empezar',
      highlighted: true,
      badge: 'Más Popular',
    },
    {
      name: 'Empresa',
      description: 'Para grandes organizaciones',
      price: 2999,
      billingPeriod: 'month' as const,
      features: [
        { name: 'Firmas ilimitadas', included: true },
        { name: 'Verificaciones ilimitadas', included: true },
        { name: 'Almacenamiento ilimitado', included: true },
        { name: 'Soporte dedicado 24/7', included: true },
        { name: 'API avanzada', included: true },
        { name: 'Onboarding personalizado', included: true },
      ],
      cta: 'Contactar Ventas',
      ctaHref: '/mx/contacto',
    },
  ],
  co: [
    {
      name: 'Básico',
      description: 'Ideal para freelancers y pequeñas empresas',
      price: 0,
      billingPeriod: 'month' as const,
      features: [
        { name: '5 firmas al mes', included: true },
        { name: 'Verificación básica', included: true },
        { name: 'Almacenamiento 1 GB', included: true },
        { name: 'Soporte por email', included: true },
        { name: 'API integración', included: false },
      ],
      cta: 'Comenzar Gratis',
      ctaHref: '/registrarse',
    },
    {
      name: 'Profesional',
      description: 'Para empresas en crecimiento',
      price: 129900,
      billingPeriod: 'month' as const,
      features: [
        { name: '50 firmas al mes', included: true },
        { name: 'Verificación avanzada', included: true },
        { name: 'Almacenamiento 50 GB', included: true },
        { name: 'Soporte prioritario', included: true },
        { name: 'API integración', included: true },
      ],
      cta: 'Probar 30 días gratis',
      ctaHref: '/empezar',
      highlighted: true,
      badge: 'Más Popular',
    },
    {
      name: 'Empresa',
      description: 'Para grandes organizaciones',
      price: 399900,
      billingPeriod: 'month' as const,
      features: [
        { name: 'Firmas ilimitadas', included: true },
        { name: 'Verificaciones ilimitadas', included: true },
        { name: 'Almacenamiento ilimitado', included: true },
        { name: 'Soporte dedicado 24/7', included: true },
        { name: 'API avanzada', included: true },
      ],
      cta: 'Contactar Ventas',
      ctaHref: '/co/contacto',
    },
  ],
  pe: [
    {
      name: 'Básico',
      description: 'Próximamente en Perú',
      price: 0,
      billingPeriod: 'month' as const,
      features: [
        { name: 'Firma electrónica', included: true },
        { name: 'Verificación de identidad', included: true },
        { name: 'Próximamente', included: false },
      ],
      cta: 'Notificarme',
      ctaHref: '/contacto',
    },
  ],
  ar: [
    {
      name: 'Básico',
      description: 'Próximamente en Argentina',
      price: 0,
      billingPeriod: 'month' as const,
      features: [
        { name: 'Firma digital', included: true },
        { name: 'Verificación de identidad', included: true },
        { name: 'Próximamente', included: false },
      ],
      cta: 'Notificarme',
      ctaHref: '/contacto',
    },
  ],
};

export default async function PreciosPaisPage({ params }: PageProps) {
  const { pais } = await params;
  const country = pais.toLowerCase();

  if (!ALLOWED_COUNTRIES.includes(country)) {
    notFound();
  }

  // Obtener configuración del país
  const countryConfig = getCountryConfig(country);
  
  // Si el país no está disponible, mostrar página "Próximamente"
  if (countryConfig && !countryConfig.available) {
    return (
      <ComingSoonCountry
        countryCode={countryConfig.code}
        countryName={countryConfig.name}
        countryFlag={countryConfig.flag}
        launchDate={countryConfig.launchDate}
      />
    );
  }

  const plans = PRICING_DATA[country] || PRICING_DATA.cl;

  return (
    <CountryRouteWrapper country={country} showCountryHeader={true}>
      <div className="py-20">
        <CountryPricingTable
          country={country}
          plans={plans}
          title="Planes y Precios"
          description="Elige el plan que mejor se adapte a tus necesidades. Sin permanencia, cancela cuando quieras."
        />
      </div>
    </CountryRouteWrapper>
  );
}

