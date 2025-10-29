import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  Globe, 
  Award,
  Target,
  Heart,
  Zap,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Nosotros - TuPatrimonio | Líderes en Servicios Legales Digitales',
  description: 'Conoce TuPatrimonio: transformando los servicios legales en Latinoamérica con tecnología de vanguardia. Nuestra misión, visión y equipo.',
  keywords: ['tupatrimonio', 'sobre nosotros', 'legal tech', 'equipo', 'misión', 'visión'],
};

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[var(--tp-brand-5)] rounded-full px-4 py-2 mb-6">
              <Building2 className="w-4 h-4 text-[var(--tp-brand)]" />
              <span className="text-sm font-medium text-[var(--tp-brand)]">
                Sobre TuPatrimonio
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transformando los Servicios Legales en{' '}
              <span className="text-[var(--tp-brand)]">Latinoamérica</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Somos una plataforma legal tech que simplifica trámites complejos, 
              democratiza el acceso a servicios legales y potencia la transformación digital 
              de empresas en toda la región.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Misión, Visión, Valores */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Misión */}
            <Card className="border-2 border-[var(--tp-brand-20)] hover:border-[var(--tp-brand)] transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-[var(--tp-brand)] rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Nuestra Misión</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 leading-relaxed">
                  Democratizar el acceso a servicios legales mediante tecnología intuitiva, 
                  eliminando barreras geográficas y económicas para empresas y profesionales 
                  en Latinoamérica.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Visión */}
            <Card className="border-2 border-[var(--tp-buttons-20)] hover:border-[var(--tp-buttons)] transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-[var(--tp-buttons)] rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Nuestra Visión</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 leading-relaxed">
                  Ser la plataforma legal tech líder en Latinoamérica, reconocida por 
                  simplificar procesos legales y empoderar a millones de usuarios con 
                  herramientas digitales confiables.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Valores */}
            <Card className="border-2 border-[var(--tp-brand-20)] hover:border-[var(--tp-brand)] transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-[var(--tp-brand-light)] rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Nuestros Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-base text-gray-700">
                  <li>✓ Innovación constante</li>
                  <li>✓ Transparencia total</li>
                  <li>✓ Seguridad garantizada</li>
                  <li>✓ Accesibilidad para todos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              TuPatrimonio en Números
            </h2>
            <p className="text-xl text-white/90">
              Creciendo junto a nuestros clientes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">+500</div>
              <div className="text-lg text-white/90">Empresas Activas</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">5</div>
              <div className="text-lg text-white/90">Países</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">+10K</div>
              <div className="text-lg text-white/90">Documentos Firmados</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">90%</div>
              <div className="text-lg text-white/90">Ahorro de Tiempo</div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué TuPatrimonio? */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir TuPatrimonio?
            </h2>
            <p className="text-xl text-gray-600">
              Innovación, seguridad y simplicidad en una sola plataforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-full h-full" />,
                title: 'Seguridad Certificada',
                description: 'Cumplimos con las más estrictas normativas de cada país. Tus datos están protegidos con encriptación de nivel bancario.'
              },
              {
                icon: <Zap className="w-full h-full" />,
                title: 'Rápido y Fácil',
                description: 'Lo que antes tomaba días, ahora lo haces en minutos. Interfaz intuitiva diseñada para cualquier usuario.'
              },
              {
                icon: <Globe className="w-full h-full" />,
                title: 'Presencia Regional',
                description: 'Operamos en Chile, México, Colombia, Perú y Argentina, adaptándonos a la legislación local de cada país.'
              },
              {
                icon: <Users className="w-full h-full" />,
                title: 'Soporte Experto',
                description: 'Equipo de abogados y expertos disponibles para ayudarte cuando lo necesites.'
              },
              {
                icon: <Award className="w-full h-full" />,
                title: 'Validez Legal Total',
                description: 'Documentos con plena validez legal, aceptados en tribunales y entidades gubernamentales.'
              },
              {
                icon: <Target className="w-full h-full" />,
                title: 'Enfoque en el Cliente',
                description: 'Tu éxito es nuestro éxito. Mejoramos constantemente basándonos en tu feedback.'
              },
            ].map((item, index) => (
              <Card key={index} className="border hover:border-[var(--tp-brand)] transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center mb-4 text-[var(--tp-brand)]">
                    {item.icon}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[var(--tp-background-light)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Listo para Transformar tu Gestión Legal?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a cientos de empresas que ya confían en TuPatrimonio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://app.tupatrimonio.app">
              <Button 
                size="lg"
                className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-8 py-6 text-lg"
              >
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="/contacto">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-[var(--tp-buttons)] px-8 py-6 text-lg"
              >
                Hablar con un Experto
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

