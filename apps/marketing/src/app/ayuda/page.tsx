import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, BookOpen, Mail, Library, Video, HelpCircle, BookMarked, MessageSquare, Phone, Clock } from 'lucide-react';
import { Icon, IconContainer } from '@tupatrimonio/ui';

export const metadata: Metadata = {
  title: 'Centro de Ayuda - TuPatrimonio | Soporte y Documentación',
  description: 'Centro de ayuda de TuPatrimonio. Encuentra documentación, tutoriales y contacta con soporte.',
};

export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand-5)] to-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-[var(--tp-brand)] text-white px-4 py-2 text-base mb-6 shadow-lg">
              <Icon icon={HelpCircle} size="sm" className="mr-2 text-white" />
              Estamos aquí para ti
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Centro de <span className="text-[var(--tp-brand)]">Ayuda</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10">
              No estás solo en esto. Encuentra respuestas rápidas o habla con nuestro equipo. 
              Tu tranquilidad es nuestra prioridad.
            </p>

            {/* Trust Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={Clock} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">Respuesta en 24h</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                <Icon icon={MessageCircle} size="sm" className="text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">Soporte en español</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950 rounded-full">
                <Icon icon={BookOpen} size="sm" className="text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300 font-medium">Guías paso a paso</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Help Cards */}
      <section className="py-16">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Cómo podemos ayudarte?
            </h2>
            <p className="text-lg text-muted-foreground">
              Elige la opción que mejor se ajuste a lo que necesitas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Link href="/base-conocimiento" className="group">
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all h-full">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={Library} 
                      variant="brand" 
                      shape="rounded" 
                      size="lg"
                    />
                  </div>
                  <CardTitle className="group-hover:text-[var(--tp-brand)] transition-colors">
                    Base de Conocimiento
                  </CardTitle>
                  <CardDescription>
                    Encuentra respuestas a las preguntas más comunes con guías detalladas y fáciles de seguir
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/blog" className="group">
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all h-full">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={BookOpen} 
                      variant="brand" 
                      shape="rounded" 
                      size="lg"
                    />
                  </div>
                  <CardTitle className="group-hover:text-[var(--tp-brand)] transition-colors">
                    Blog y Tutoriales
                  </CardTitle>
                  <CardDescription>
                    Artículos prácticos, casos de uso y consejos para sacarle el máximo provecho a nuestros servicios
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/contacto" className="group">
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all h-full">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={MessageSquare} 
                      variant="brand" 
                      shape="rounded" 
                      size="lg"
                    />
                  </div>
                  <CardTitle className="group-hover:text-[var(--tp-brand)] transition-colors">
                    Contacta con Soporte
                  </CardTitle>
                  <CardDescription>
                    ¿No encuentras lo que buscas? Habla directamente con nuestro equipo y te ayudamos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Additional Help Options */}
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={Video} 
                      variant="solid-brand" 
                      shape="rounded" 
                      size="md"
                    />
                  </div>
                  <div>
                    <CardTitle className="mb-2 group-hover:text-[var(--tp-brand)] transition-colors">
                      Tutoriales en Video
                    </CardTitle>
                    <CardDescription className="mb-4">
                      Aprende viendo. Tutoriales paso a paso para que todo sea más fácil.
                    </CardDescription>
                    <Badge variant="outline" className="text-xs">
                      Próximamente
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section con gradiente */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] relative overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl tp-container text-center relative z-10">
          <div className="mb-6">
            <Icon icon={MessageCircle} size="xl" variant="white" className="mx-auto" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            ¿Necesitas ayuda inmediata?
          </h2>
          
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Sabemos que a veces las cosas son urgentes. Nuestro equipo está listo para ayudarte 
            a resolver cualquier duda o problema que tengas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/contacto">
              <Button 
                size="lg" 
                className="bg-white text-[var(--tp-brand)] hover:bg-gray-100 dark:hover:bg-gray-200 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={Mail} size="md" variant="inherit" className="mr-2" />
                Contactar Soporte
              </Button>
            </Link>
            
            <Link href="/base-conocimiento">
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white border-2 border-white hover:bg-white/10 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={BookMarked} size="md" variant="white" className="mr-2" />
                Ver Base de Conocimiento
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon={Clock} size="md" variant="white" />
              <span>Respuesta en menos de 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={MessageCircle} size="md" variant="white" />
              <span>Soporte amigable y cercano</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={BookOpen} size="md" variant="white" />
              <span>Sin tecnicismos complicados</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

