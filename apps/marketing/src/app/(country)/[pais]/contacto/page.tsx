import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/forms/ContactForm';
import { CountryRouteWrapper } from '@/components/CountryRouteWrapper';
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
  };
}

// Información de contacto por país
const CONTACT_INFO: Record<string, { phones: string[]; emails: string[]; address: string }> = {
  cl: {
    phones: ['+56 9 XXXX XXXX'],
    emails: ['chile@tupatrimonio.app'],
    address: 'Santiago, Región Metropolitana, Chile',
  },
  mx: {
    phones: ['+52 55 XXXX XXXX'],
    emails: ['mexico@tupatrimonio.app'],
    address: 'Ciudad de México, México',
  },
  co: {
    phones: ['+57 1 XXX XXXX'],
    emails: ['colombia@tupatrimonio.app'],
    address: 'Bogotá, Colombia',
  },
  pe: {
    phones: ['+51 1 XXX XXXX'],
    emails: ['peru@tupatrimonio.app'],
    address: 'Lima, Perú',
  },
  ar: {
    phones: ['+54 11 XXXX XXXX'],
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2">
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Envíanos un Mensaje</CardTitle>
                  <CardDescription className="text-base">
                    Respuesta en menos de 24 horas hábiles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>

            {/* Info de contacto */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Información de Contacto</CardTitle>
                  <CardDescription>{countryNames[country]}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[var(--tp-brand)]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      {contactInfo.emails.map((email, i) => (
                        <a 
                          key={i}
                          href={`mailto:${email}`} 
                          className="text-sm text-[var(--tp-brand)] hover:underline block"
                        >
                          {email}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[var(--tp-brand)]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp</p>
                      {contactInfo.phones.map((phone, i) => (
                        <p key={i} className="text-sm text-gray-600">{phone}</p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[var(--tp-brand)]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ubicación</p>
                      <p className="text-sm text-gray-600">{contactInfo.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
                <CardHeader>
                  <CardTitle className="text-lg">Horario de Atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CountryRouteWrapper>
  );
}

