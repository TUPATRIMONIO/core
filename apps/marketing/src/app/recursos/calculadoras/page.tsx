import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, DollarSign, Percent } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Calculadoras Financieras y Legales - TuPatrimonio',
  description: 'Herramientas gratuitas para calcular costos de trámites, impuestos y más.',
};

export default function CalculadorasPage() {
  const calculadoras = [
    {
      title: 'Calculadora de Costos de Constitución',
      description: 'Estima cuánto te costará constituir tu empresa',
      icon: <DollarSign className="w-full h-full" />,
      color: 'var(--tp-brand)',
    },
    {
      title: 'Calculadora de Impuestos',
      description: 'Calcula tus obligaciones tributarias',
      icon: <Percent className="w-full h-full" />,
      color: 'var(--tp-buttons)',
    },
    {
      title: 'Calculadora de ROI',
      description: 'Calcula el retorno de inversión de digitalizar procesos',
      icon: <TrendingUp className="w-full h-full" />,
      color: 'var(--tp-brand)',
    },
    {
      title: 'Calculadora de Ahorros',
      description: 'Descubre cuánto ahorras con firma electrónica',
      icon: <Calculator className="w-full h-full" />,
      color: 'var(--tp-buttons)',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Calculator className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Calculadoras <span className="text-[var(--tp-brand)]">Gratuitas</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Herramientas para ayudarte a tomar mejores decisiones financieras
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {calculadoras.map((calc, index) => (
            <Card key={index} className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl text-center">
              <CardHeader>
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${calc.color}20` }}
                >
                  <div style={{ color: calc.color }} className="w-8 h-8">
                    {calc.icon}
                  </div>
                </div>
                <CardTitle className="text-xl">{calc.title}</CardTitle>
                <CardDescription className="text-base">
                  {calc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  style={{ backgroundColor: calc.color }}
                >
                  Usar Calculadora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
            <CardContent className="py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                ¿Necesitas una calculadora específica?
              </h2>
              <p className="text-gray-600 mb-6">
                Contáctanos y la crearemos para ti
              </p>
              <Link href="/contacto">
                <Button className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]">
                  Solicitar Calculadora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

