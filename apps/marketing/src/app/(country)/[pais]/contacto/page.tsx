import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/forms/ContactForm';
import { CountryRouteWrapper } from '@/components/CountryRouteWrapper';
import { ComingSoonCountry } from '@/components/ComingSoonCountry';
import { getCountryConfig } from '@tupatrimonio/location';
import { Mail, MessageCircle, Phone, MapPin } from 'lucide-react';
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
    title: `Contacto ${countryNames[country] || 'País'} - TuPatrimonio`,
    description: `Contáctanos en ${countryNames[country] || 'tu país'}. Soporte especializado para tus trámites legales digitales.`,
    keywords: [`contacto ${countryNames[country]}`, 'soporte', 'ayuda', 'tupatrimonio'],
    openGraph: {
      title: `Contacto ${countryNames[country]} - TuPatrimonio`,
      description: `Contáctanos en ${countryNames[country]}. Soporte especializado para tus trámites legales digitales.`,
    },
  };
}

// Información de contacto por país
const CONTACT_INFO: Record<string, { phones: string[]; emails: string[]; address: string }> = {
  cl: {
    phones: ['+56 2 2345 6789', '+56 9 8765 4321'],
    emails: ['hola@tupatrimonio.app', 'soporte@tupatrimonio.app'],
    address: 'Santiago, Chile',
  },
  mx: {
    phones: ['+52 55 1234 5678'],
    emails: ['mexico@tupatrimonio.app'],
    address: 'Ciudad de México, México',
  },
  co: {
    phones: ['+57 1 234 5678'],
    emails: ['colombia@tupatrimonio.app'],
    address: 'Bogotá, Colombia',
  },
  pe: {
    phones: ['+51 1 234 5678'],
    emails: ['peru@tupatrimonio.app'],
    address: 'Lima, Perú',
  },
  ar: {
    phones: ['+54 11 1234 5678'],
    emails: ['argentina@tupatrimonio.app'],
    address: 'Buenos Aires, Argentina',
  },
};

export default async function ContactoPaisPage({ params }: PageProps) {
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

  const countryNames: Record<string, string> = {
    cl: 'Chile',
    mx: 'México',
    co: 'Colombia',
    pe: 'Perú',
    ar: 'Argentina',
  };

  const contactInfo = CONTACT_INFO[country];

  return (
    <CountryRouteWrapper country={country} showCountryHeader={true}>
        <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Contáctanos en{' '}
                <span className="text-[var(--tp-brand)]">{countryNames[country]}</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Nuestro equipo local está listo para ayudarte con tus trámites legales digitales
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Formulario de Contacto */}
              <div>
                <ContactForm />
              </div>

              {/* Información de Contacto */}
              <div className="space-y-8">
                {/* Canales de Contacto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2 text-[var(--tp-brand)]" />
                      Canales de Contacto
                    </CardTitle>
                    <CardDescription>
                      Múltiples formas de comunicarte con nosotros
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Teléfono */}
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-[var(--tp-brand)] mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Teléfono</h3>
                        {contactInfo.phones.map((phone, index) => (
                          <p key={index} className="text-gray-600">
                            <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-[var(--tp-brand)]">
                              {phone}
                            </a>
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-[var(--tp-brand)] mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Email</h3>
                        {contactInfo.emails.map((email, index) => (
                          <p key={index} className="text-gray-600">
                            <a href={`mailto:${email}`} className="hover:text-[var(--tp-brand)]">
                              {email}
                            </a>
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Ubicación */}
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-[var(--tp-brand)] mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Ubicación</h3>
                        <p className="text-gray-600">{contactInfo.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Horarios de Atención */}
                <Card>
                  <CardHeader>
                    <CardTitle>Horarios de Atención</CardTitle>
                    <CardDescription>
                      Te atendemos en horario comercial local
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex justify-between">
                        <span>Lunes a Viernes:</span>
                        <span className="font-medium">9:00 - 18:00</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Sábados:</span>
                        <span className="font-medium">10:00 - 14:00</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-3">
                        Horario local de {countryNames[country]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </CountryRouteWrapper>
  );
}