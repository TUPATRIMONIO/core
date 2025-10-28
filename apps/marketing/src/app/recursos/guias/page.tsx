import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guías Legales y Empresariales - TuPatrimonio',
  description: 'Guías paso a paso sobre trámites legales, constitución de empresas y más. Contenido gratuito.',
};

export default function GuiasPage() {
  const guias = [
    {
      title: 'Cómo Constituir una Empresa en Chile',
      description: 'Guía completa para crear tu empresa en 5 pasos simples',
      category: 'Legal',
      readTime: '10 min',
      downloadable: true,
    },
    {
      title: 'Guía de Firma Electrónica',
      description: 'Todo lo que necesitas saber sobre firma electrónica y su validez legal',
      category: 'Legal Tech',
      readTime: '8 min',
      downloadable: true,
    },
    {
      title: 'KYC: Verificación de Identidad',
      description: 'Cómo funciona la verificación de identidad digital',
      category: 'Seguridad',
      readTime: '6 min',
      downloadable: false,
    },
    {
      title: 'Contratos Laborales Digitales',
      description: 'Guía para digitalizar contratos de trabajo',
      category: 'RRHH',
      readTime: '12 min',
      downloadable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <BookOpen className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Guías <span className="text-[var(--tp-brand)]">Gratuitas</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Aprende paso a paso cómo realizar trámites legales y empresariales
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {guias.map((guia, index) => (
            <Card key={index} className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="outline">{guia.category}</Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {guia.readTime}
                  </div>
                </div>
                <CardTitle className="text-2xl">{guia.title}</CardTitle>
                <CardDescription className="text-base">
                  {guia.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/blog">
                  <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]">
                    Leer Guía
                  </Button>
                </Link>
                {guia.downloadable && (
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

