'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Bell, CheckCircle, ArrowLeft, Zap, Shield, Globe, Sparkles, Users, Lock, MapPin } from 'lucide-react';
import { Icon, IconContainer } from '@tupatrimonio/ui';
import Link from 'next/link';
import { NotifyMeForm } from './forms/NotifyMeForm';

interface ComingSoonCountryProps {
  countryCode: string;
  countryName: string;
  countryFlag: string;
  launchDate?: string;
}

export function ComingSoonCountry({ 
  countryCode, 
  countryName, 
  countryFlag, 
  launchDate 
}: ComingSoonCountryProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-background py-20">
        <div className="max-w-7xl tp-container">
          {/* Back to Chile link */}
          <div className="mb-8">
            <Link href="/cl">
              <Button variant="ghost" size="sm" className="text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)] dark:text-foreground dark:hover:text-[var(--tp-brand)]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a TuPatrimonio Chile
              </Button>
            </Link>
          </div>

          <div className="text-center">
            {/* Country flag and badge */}
            <div className="mb-6">
              <div className="text-7xl md:text-8xl mb-4 animate-bounce">{countryFlag}</div>
              <Badge className="bg-[var(--tp-buttons)] dark:bg-[var(--tp-brand)] text-white px-4 py-2 text-base flex items-center gap-2 w-fit mx-auto shadow-lg">
                <Icon icon={Rocket} size="sm" className="text-white" />
                <span>Próximamente</span>
              </Badge>
            </div>

            {/* Main heading */}
            <h1 className="mb-6">
              ¡Pronto en{' '}
              <span className="text-[var(--tp-brand)]">{countryName}</span>!
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Estamos trabajando para llevar nuestros servicios legales digitales a {countryName}. 
              Pronto podrás disfrutar de la misma tranquilidad y eficiencia que ya disfrutan miles de usuarios.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={CheckCircle} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">Validez Legal Garantizada</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={Shield} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">100% Seguro</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={Users} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">+160K usuarios confían en nosotros</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll get section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Lo Que Podrás Hacer en {countryName}
            </h2>
            <p className="text-xl text-muted-foreground">
              Los mismos servicios que han transformado la experiencia legal de miles de usuarios
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Zap} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                  />
                </div>
                <CardTitle>Rápido y Sin Filas</CardTitle>
                <CardDescription>
                  Documentos listos en menos de 24 horas. Sin esperas, sin papeleos interminables.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Shield} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                  />
                </div>
                <CardTitle>Seguridad Total</CardTitle>
                <CardDescription>
                  Validez legal garantizada. Cumplimiento de todas las normativas locales.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Globe} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                  />
                </div>
                <CardTitle>Desde Cualquier Lugar</CardTitle>
                <CardDescription>
                  Gestiona todo desde tu celular o computador. Sin desplazamientos.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Notify me form section */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand-5)] to-transparent">
        <div className="max-w-2xl tp-container">
          <Card className="border-2 border-[var(--tp-brand)] shadow-2xl bg-card overflow-hidden">
            <CardHeader className="text-center pt-8">
              <div className="mb-6">
                <IconContainer 
                  icon={Bell} 
                  variant="solid-brand" 
                  shape="circle" 
                  size="lg"
                  className="mx-auto"
                />
              </div>
              <CardTitle className="text-3xl mb-3">
                Sé el Primero en Enterarte
              </CardTitle>
              <CardDescription className="text-base">
                Regístrate y te notificaremos cuando estemos disponibles en {countryName}. 
                Además, obtendrás acceso anticipado y beneficios exclusivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              <NotifyMeForm country={countryCode} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Beneficios de Ser Pionero
            </h2>
            <p className="text-xl text-muted-foreground">
              Los primeros usuarios en {countryName} recibirán ventajas exclusivas
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Sparkles} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>Acceso Anticipado</CardTitle>
                <CardDescription>
                  Sé de los primeros en usar la plataforma antes del lanzamiento oficial.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={CheckCircle} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>Descuentos Especiales</CardTitle>
                <CardDescription>
                  Precios preferenciales para los usuarios pioneros en {countryName}.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Users} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>Soporte Prioritario</CardTitle>
                <CardDescription>
                  Atención personalizada y soporte dedicado desde el primer día.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Meanwhile in Chile CTA */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] relative overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl tp-container text-center relative z-10">
          <h2 className="text-white mb-6">
            ¿Necesitas Servicios Legales Digitales Ahora?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
            TuPatrimonio ya está operativo en Chile con todos nuestros servicios disponibles. 
            Más de 160,000 usuarios ya confían en nosotros.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/cl">
              <Button 
                size="lg" 
                className="bg-white text-[var(--tp-brand)] hover:bg-gray-100 dark:hover:bg-gray-200 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={MapPin} size="md" variant="inherit" className="mr-2" />
                Ir a TuPatrimonio Chile 🇨🇱
              </Button>
            </Link>
            <Link href="/cl/precios">
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white border-2 border-white hover:bg-white/10 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ver Precios y Servicios
              </Button>
            </Link>
          </div>
          
          {/* Trust bar con iconos minimalistas */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon={Zap} size="md" variant="white" />
              <span>Documentos en 24hrs</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Lock} size="md" variant="white" />
              <span>100% Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={CheckCircle} size="md" variant="white" />
              <span>Validez Legal Garantizada</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

