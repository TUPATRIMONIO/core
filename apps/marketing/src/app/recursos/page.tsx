import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calculator, FileText, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Recursos - TuPatrimonio | Guías, Calculadoras y Plantillas',
  description: 'Recursos gratuitos para emprendedores: guías legales, calculadoras financieras y plantillas de documentos.',
};

export default function RecursosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background py-20">
      <div className="max-w-7xl tp-container">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Recursos <span className="text-[var(--tp-brand)]">Gratuitos</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Herramientas, guías y plantillas para ayudarte a gestionar mejor tu negocio
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-14 h-14 bg-[var(--tp-brand-10)] rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-[var(--tp-brand)]" />
              </div>
              <CardTitle className="text-2xl">Guías</CardTitle>
              <CardDescription className="text-base">
                Guías paso a paso sobre temas legales y empresariales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/recursos/guias">
                <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]">
                  Ver Guías
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-14 h-14 bg-[var(--tp-brand-10)] rounded-xl flex items-center justify-center mb-4">
                <Calculator className="w-7 h-7 text-[var(--tp-brand)]" />
              </div>
              <CardTitle className="text-2xl">Calculadoras</CardTitle>
              <CardDescription className="text-base">
                Herramientas para cálculos financieros y legales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/recursos/calculadoras">
                <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]">
                  Ver Calculadoras
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[var(--tp-brand)] transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-14 h-14 bg-[var(--tp-brand-10)] rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-[var(--tp-brand)]" />
              </div>
              <CardTitle className="text-2xl">Plantillas</CardTitle>
              <CardDescription className="text-base">
                Plantillas de documentos legales y empresariales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/recursos/plantillas">
                <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]">
                  Ver Plantillas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
            <CardContent className="py-12">
              <Download className="w-12 h-12 text-[var(--tp-brand)] mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Todos nuestros recursos son gratuitos
              </h2>
              <p className="text-muted-foreground mb-6">
                No necesitas registrarte para acceder a la mayoría de recursos. 
                Solo crea una cuenta si deseas guardar tus favoritos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

