import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, BookOpen, Mail, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Centro de Ayuda - TuPatrimonio | Soporte y Documentación',
  description: 'Centro de ayuda de TuPatrimonio. Encuentra documentación, tutoriales y contacta con soporte.',
};

export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background py-20">
      <div className="max-w-7xl tp-container">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Centro de <span className="text-[var(--tp-brand)]">Ayuda</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Encuentra respuestas, tutoriales y ponte en contacto con nuestro equipo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link href="/faq">
            <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl h-full">
              <CardHeader>
                <HelpCircle className="w-12 h-12 text-[var(--tp-brand)] mb-4" />
                <CardTitle>Preguntas Frecuentes</CardTitle>
                <CardDescription>Respuestas rápidas a dudas comunes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/recursos">
            <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl h-full">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-[var(--tp-brand)] mb-4" />
                <CardTitle>Recursos</CardTitle>
                <CardDescription>Guías, plantillas y herramientas</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/blog">
            <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl h-full">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-[var(--tp-brand)] mb-4" />
                <CardTitle>Blog</CardTitle>
                <CardDescription>Artículos y tutoriales</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/contacto">
            <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl h-full">
              <CardHeader>
                <Mail className="w-12 h-12 text-[var(--tp-brand)] mb-4" />
                <CardTitle>Contacto</CardTitle>
                <CardDescription>Habla con nuestro equipo</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <Card className="bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] text-white border-0">
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">¿Necesitas ayuda inmediata?</h2>
            <p className="text-xl mb-8 text-white/90">
              Nuestro equipo de soporte está disponible para ayudarte
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contacto">
                <Button size="lg" variant="outline" className="bg-card text-[var(--tp-brand)] hover:bg-gray-100">
                  Contactar Soporte
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

