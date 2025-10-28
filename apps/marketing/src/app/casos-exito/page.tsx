import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Casos de Éxito - TuPatrimonio | Historias de Clientes',
  description: 'Conoce cómo empresas de toda Latinoamérica transformaron sus procesos legales con TuPatrimonio.',
};

export default function CasosExitoPage() {
  const cases = [
    {
      company: 'StartupTech Chile',
      industry: 'Tecnología',
      country: '🇨🇱',
      challenge: 'Necesitaban firmar contratos con clientes internacionales de forma rápida',
      solution: 'Implementaron firma electrónica avanzada con validez internacional',
      results: ['90% reducción en tiempo de firma', '100+ contratos firmados al mes', 'Ahorro de $500.000 CLP mensuales'],
      testimonial: 'TuPatrimonio nos permitió escalar sin preocuparnos por la burocracia. Ahora firmamos contratos en minutos.',
      author: 'María González',
      role: 'CEO',
    },
    {
      company: 'InmoSur',
      industry: 'Inmobiliaria',
      country: '🇨🇴',
      challenge: 'Gestión manual de arriendos con cientos de contratos en papel',
      solution: 'Digitalizaron todos los contratos de arriendo y gestión de pagos',
      results: ['200+ contratos digitalizados', 'Reducción 80% en errores', 'Satisfacción clientes: 95%'],
      testimonial: 'La transformación digital con TuPatrimonio fue clave para nuestra expansión regional.',
      author: 'Carlos Mendoza',
      role: 'Gerente General',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Casos de <span className="text-[var(--tp-brand)]">Éxito</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conoce cómo empresas como la tuya transformaron sus procesos legales
          </p>
        </div>

        <div className="space-y-12">
          {cases.map((item, index) => (
            <Card key={index} className="border-2 hover:border-[var(--tp-brand)] transition-all">
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{item.company}</CardTitle>
                      <span className="text-2xl">{item.country}</span>
                    </div>
                    <Badge variant="outline">{item.industry}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Quote className="w-5 h-5 text-[var(--tp-brand)]" />
                      El Desafío
                    </h3>
                    <p className="text-gray-600">{item.challenge}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[var(--tp-success)]" />
                      La Solución
                    </h3>
                    <p className="text-gray-600">{item.solution}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--tp-brand)]" />
                    Resultados
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {item.results.map((result, i) => (
                      <div key={i} className="bg-[var(--tp-brand-5)] rounded-lg p-4 text-center">
                        <p className="font-medium text-gray-900">{result}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-[var(--tp-brand)]">
                  <Quote className="w-8 h-8 text-[var(--tp-brand)] mb-4" />
                  <p className="text-lg text-gray-700 italic mb-4">"{item.testimonial}"</p>
                  <div>
                    <p className="font-bold text-gray-900">{item.author}</p>
                    <p className="text-sm text-gray-600">{item.role}, {item.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] text-white border-0">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">¿Quieres ser nuestro próximo caso de éxito?</h2>
              <p className="text-xl mb-6 text-white/90">
                Únete a cientos de empresas que ya transformaron sus procesos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

