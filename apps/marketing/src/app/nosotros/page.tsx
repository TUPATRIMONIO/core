import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icon, IconContainer } from '@tupatrimonio/ui';
import { 
  Building2, 
  Users, 
  Globe, 
  Award,
  Target,
  Heart,
  Shield,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { USERS_COUNT } from '@/lib/constants';
import { StatsSection } from '@/components/StatsSection';

export const metadata: Metadata = {
  title: 'Sobre Nosotros - TuPatrimonio | Tu Tranquilidad, Nuestra Prioridad',
  description: 'Conoce cómo TuPatrimonio te ayuda a resolver tus trámites legales de forma simple y confiable. Estamos aquí para darte tranquilidad cuando más lo necesitas.',
  keywords: ['tupatrimonio', 'sobre nosotros', 'quiénes somos', 'servicios legales', 'firma electrónica', 'notaría digital'],
};

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl tp-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[var(--tp-brand-5)] rounded-full px-4 py-2 mb-6">
              <Icon icon={Building2} size="sm" variant="brand" />
              <span className="text-sm font-medium text-[var(--tp-brand)]">
                Sobre TuPatrimonio
              </span>
            </div>

            <h1 className="mb-6">
              Estamos aquí para darte{' '}
              <span className="text-[var(--tp-brand)]">tranquilidad</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Sabemos lo estresante que puede ser lidiar con trámites legales. Por eso creamos 
              una forma más simple y confiable de hacer las cosas. Sin papeleos eternos, 
              sin citas interminables, sin complicaciones. Solo soluciones que funcionan cuando más las necesitas.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Misión, Visión, Valores */}
      <section className="py-20">
        <div className="max-w-7xl tp-container">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Misión */}
            <Card className="border-2 border-[var(--tp-brand-20)] hover:border-[var(--tp-brand)] transition-all">
              <CardHeader>
                <IconContainer 
                  icon={Target} 
                  variant="solid-brand" 
                  shape="rounded" 
                  size="lg" 
                  className="mb-4"
                />
                <CardTitle>¿Qué hacemos?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Hacemos que tus trámites legales sean fáciles y rápidos. No importa dónde estés 
                  o cuánto tiempo tengas: te ayudamos a resolver lo que necesitas sin complicaciones. 
                  Eso es todo.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Visión */}
            <Card className="border-2 border-[var(--tp-brand-20)] hover:border-[var(--tp-brand)] transition-all">
              <CardHeader>
                <IconContainer 
                  icon={Globe} 
                  variant="solid-brand" 
                  shape="rounded" 
                  size="lg" 
                  className="mb-4"
                />
                <CardTitle>¿A dónde vamos?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Queremos ser tu primera opción cuando pienses en trámites legales en Latinoamérica. 
                  El lugar al que vuelves porque sabes que funciona, es confiable, y te ahorra dolores 
                  de cabeza.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Valores */}
            <Card className="border-2 border-[var(--tp-brand-20)] hover:border-[var(--tp-brand)] transition-all">
              <CardHeader>
                <IconContainer 
                  icon={Heart} 
                  variant="solid-brand" 
                  shape="rounded" 
                  size="lg" 
                  className="mb-4"
                />
                <CardTitle>¿Cómo lo hacemos?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Hablamos claro, sin rodeos</li>
                  <li>✓ Siempre buscamos mejorar</li>
                  <li>✓ Tu información está protegida</li>
                  <li>✓ Fácil de usar para todos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <StatsSection variant="nosotros" />

      {/* ¿Por qué TuPatrimonio? */}
      <section className="py-20">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-lg text-muted-foreground">
              Porque entendemos perfectamente por lo que estás pasando
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Tus Datos Están Seguros',
                description: 'Tu información está protegida, punto. Sin complicaciones técnicas, solo la tranquilidad de saber que está a salvo.'
              },
              {
                icon: Zap,
                title: 'Rápido y Sin Vueltas',
                description: '¿Te acuerdas cuando resolver esto tomaba días? Ahora lo haces en minutos. Así de simple.'
              },
              {
                icon: Globe,
                title: 'Dónde sea que Estés',
                description: 'Chile, México, Colombia, Perú, Argentina... No importa tu ubicación, te ayudamos como corresponde en cada lugar.'
              },
              {
                icon: Users,
                title: 'Nunca Estás Solo',
                description: 'Si te trabas o tienes dudas, estamos aquí. Hablamos claro y resolvemos tus preguntas sin hacerte sentir perdido.'
              },
              {
                icon: Award,
                title: 'Vale de Verdad',
                description: 'Todo lo que hacemos tiene validez legal completa. Es como ir a la notaría, pero sin salir de tu casa.'
              },
              {
                icon: Target,
                title: 'Si Funciona para Ti, Funciona',
                description: 'No nos obsesionamos con la tecnología. Nos importa que resuelva tu problema real. Eso es lo único que cuenta.'
              },
            ].map((item, index) => (
              <Card key={index} className="border hover:border-[var(--tp-brand)] transition-all hover:shadow-lg">
                <CardHeader>
                  <IconContainer 
                    icon={item.icon} 
                    variant="brand" 
                    shape="rounded" 
                    size="md" 
                    className="mb-4"
                  />
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
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
        <div className="max-w-4xl tp-container text-center">
          <h2 className="mb-4">
            ¿Listo para Resolver tus Trámites sin Complicaciones?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Únete a más de {USERS_COUNT.short} personas que ya confían en nosotros
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://tupatrimon.io">
              <Button 
                size="lg"
                variant="default"
                className="px-8 py-6"
              >
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="/contacto">
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-6"
              >
                Hablar con Nosotros
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

