'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Bell, CheckCircle, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl tp-container text-center">
          {/* Back to Chile link */}
          <div className="mb-8">
            <Link href="/cl">
              <Button variant="ghost" size="sm" className="text-[var(--tp-brand)]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a TuPatrimonio Chile
              </Button>
            </Link>
          </div>

          {/* Country flag and badge */}
          <div className="mb-6">
            <div className="text-8xl mb-4">{countryFlag}</div>
            <Badge className="bg-[var(--tp-brand)] text-white px-4 py-2 text-base">
              <Rocket className="w-4 h-4 mr-2" />
              Próximamente
            </Badge>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            ¡Pronto en{' '}
            <span className="text-[var(--tp-brand)]">{countryName}</span>!
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-4 leading-relaxed max-w-3xl mx-auto">
            Estamos trabajando para llevar nuestros servicios legales digitales a {countryName}
          </p>

          {launchDate && (
            <p className="text-lg text-[var(--tp-brand)] font-semibold mb-8">
              Lanzamiento estimado: {launchDate}
            </p>
          )}
        </div>
      </section>

      {/* What to expect section */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl tp-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Qué puedes esperar?
            </h2>
            <p className="text-lg text-gray-600">
              Traeremos toda nuestra plataforma adaptada a la legislación de {countryName}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-[var(--tp-brand-20)]">
              <CardHeader>
                <div className="w-16 h-16 bg-[var(--tp-brand-10)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--tp-brand)]" />
                </div>
                <CardTitle className="text-xl text-center">Firma Electrónica</CardTitle>
                <CardDescription className="text-center">
                  Con validez legal según la normativa de {countryName}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-[var(--tp-brand-20)]">
              <CardHeader>
                <div className="w-16 h-16 bg-[var(--tp-brand-10)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--tp-brand)]" />
                </div>
                <CardTitle className="text-xl text-center">Verificación KYC</CardTitle>
                <CardDescription className="text-center">
                  Documentos y biometría específica para {countryName}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-[var(--tp-brand-20)]">
              <CardHeader>
                <div className="w-16 h-16 bg-[var(--tp-brand-10)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--tp-brand)]" />
                </div>
                <CardTitle className="text-xl text-center">Notaría Digital</CardTitle>
                <CardDescription className="text-center">
                  Trámites notariales 100% online y legales
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Notify me form section */}
      <section className="py-20">
        <div className="max-w-2xl tp-container">
          <Card className="border-2 border-[var(--tp-brand)] shadow-2xl">
            <CardHeader className="text-center bg-gradient-to-br from-[var(--tp-brand-5)] to-transparent">
              <div className="w-16 h-16 bg-[var(--tp-brand)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">
                Sé el primero en enterarte
              </CardTitle>
              <CardDescription className="text-base">
                Regístrate y te notificaremos cuando estemos disponibles en {countryName}. 
                Además, obtendrás acceso anticipado y beneficios exclusivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <NotifyMeForm country={countryCode} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Meanwhile in Chile section */}
      <section className="py-16 bg-[var(--tp-brand-5)]">
        <div className="max-w-4xl tp-container text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            ¿Necesitas servicios legales digitales ahora?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            TuPatrimonio ya está operativo en Chile con todos nuestros servicios disponibles
          </p>
          <Link href="/cl">
            <Button 
              size="lg" 
              className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-8 py-6 text-lg"
            >
              🇨🇱 Ir a TuPatrimonio Chile
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

