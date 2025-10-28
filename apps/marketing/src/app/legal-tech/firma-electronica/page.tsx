import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileSignature, 
  CheckCircle,
  Shield,
  Zap,
  Globe,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Firma Electrónica - TuPatrimonio | Validez Legal en Latinoamérica',
  description: 'Firma electrónica con validez legal total. Cumple Ley 19.799 (Chile), NOM-151 (México), Ley 527 (Colombia). Simple, rápida y segura.',
  keywords: ['firma electrónica', 'firma digital', 'validez legal', 'ley 19.799', 'NOM-151', 'ley 527'],
};

export default function FirmaElectronicaPage() {
  return (
    <VerticalLayout
      title="Firma Electrónica"
      description="Firma documentos con validez legal total en toda Latinoamérica. Seguro, rápido y cumple con todas las normativas locales."
      icon={<FileSignature className="w-full h-full" />}
      color="var(--tp-brand)"
      breadcrumb={[
        { label: 'Legal Tech', href: '/legal-tech' },
        { label: 'Firma Electrónica', href: '/legal-tech/firma-electronica' },
      ]}
      showCTA={true}
      ctaText="Comenzar a Firmar"
      ctaHref="/empezar"
    >
      {/* Tipos de Firma */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Tipos de Firma Disponibles
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-12 h-12 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center mb-4">
                <FileSignature className="w-6 h-6 text-[var(--tp-brand)]" />
              </div>
              <CardTitle className="text-2xl">Firma Simple</CardTitle>
              <CardDescription className="text-base">
                Ideal para documentos internos y acuerdos básicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {[
                  'Validez legal para documentos internos',
                  'Proceso ultrarrápido (menos de 1 minuto)',
                  'Solo requiere email',
                  'Perfecta para contratos simples',
                  'Trazabilidad digital completa',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/empezar">
                <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]">
                  Probar Firma Simple
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 border-[var(--tp-brand)] bg-gradient-to-b from-white to-[var(--tp-brand-5)] shadow-xl">
            <CardHeader>
              <div className="w-12 h-12 bg-[var(--tp-brand)] rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Firma Avanzada</CardTitle>
              <CardDescription className="text-base">
                Máxima seguridad para documentos oficiales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {[
                  'Validez legal total ante tribunales',
                  'Certificación notarial incluida',
                  'Verificación de identidad biométrica',
                  'Sellado de tiempo certificado',
                  'Aceptada en entidades gubernamentales',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/empezar">
                <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]">
                  Probar Firma Avanzada
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Características */}
      <section className="mb-20 bg-[var(--tp-background-light)] rounded-3xl p-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Características Principales
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-full h-full" />,
              title: 'Ultrarrápida',
              description: 'Firma en segundos desde cualquier dispositivo. Sin descargas ni instalaciones.',
            },
            {
              icon: <Lock className="w-full h-full" />,
              title: 'Máxima Seguridad',
              description: 'Encriptación de extremo a extremo. Tus documentos están protegidos.',
            },
            {
              icon: <Globe className="w-full h-full" />,
              title: 'Validez Regional',
              description: 'Cumple legislación de Chile, México, Colombia, Perú y Argentina.',
            },
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-brand)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cumplimiento Legal */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Cumplimiento Normativo por País
        </h2>
        <div className="grid md:grid-cols-5 gap-6">
          {[
            { country: '🇨🇱 Chile', law: 'Ley 19.799' },
            { country: '🇲🇽 México', law: 'NOM-151' },
            { country: '🇨🇴 Colombia', law: 'Ley 527' },
            { country: '🇵🇪 Perú', law: 'Ley 27269' },
            { country: '🇦🇷 Argentina', law: 'Ley 25.506' },
          ].map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-all">
              <CardHeader>
                <div className="text-3xl mb-2">{item.country.split(' ')[0]}</div>
                <CardTitle className="text-lg">{item.country.split(' ')[1]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-[var(--tp-brand)]">{item.law}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Casos de uso */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          ¿Para qué puedes usar la Firma Electrónica?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            'Contratos laborales',
            'Acuerdos comerciales',
            'Poderes y mandatos',
            'Documentos financieros',
            'Contratos de arriendo',
            'Actas de directorio',
            'Compraventa de bienes',
            'Contratos de servicios',
            'Documentos corporativos',
          ].map((useCase, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-[var(--tp-brand)] transition-all"
            >
              <CheckCircle className="w-5 h-5 text-[var(--tp-brand)] shrink-0" />
              <span className="text-gray-700">{useCase}</span>
            </div>
          ))}
        </div>
      </section>
    </VerticalLayout>
  );
}

