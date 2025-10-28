import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Home } from 'lucide-react';

interface VerticalLayoutProps {
  /**
   * Título del vertical
   */
  title: string;
  /**
   * Descripción del vertical
   */
  description: string;
  /**
   * Icono del vertical (componente)
   */
  icon: ReactNode;
  /**
   * Color del vertical (variable CSS)
   */
  color?: string;
  /**
   * Contenido principal
   */
  children: ReactNode;
  /**
   * Breadcrumb items
   */
  breadcrumb?: Array<{ label: string; href: string }>;
  /**
   * Mostrar CTA al final
   */
  showCTA?: boolean;
  /**
   * Texto del CTA
   */
  ctaText?: string;
  /**
   * Href del CTA
   */
  ctaHref?: string;
}

export function VerticalLayout({
  title,
  description,
  icon,
  color = 'var(--tp-brand)',
  children,
  breadcrumb = [],
  showCTA = true,
  ctaText = 'Comenzar Ahora',
  ctaHref = '/empezar',
}: VerticalLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white">
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Link 
                href="/" 
                className="text-gray-500 hover:text-[var(--tp-brand)] transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Inicio
              </Link>
              {breadcrumb.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  {index === breadcrumb.length - 1 ? (
                    <span className="text-gray-900 font-medium">{item.label}</span>
                  ) : (
                    <Link 
                      href={item.href}
                      className="text-gray-500 hover:text-[var(--tp-brand)] transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Hero del vertical */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Icono */}
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              }}
            >
              <div className="text-white w-10 h-10">
                {icon}
              </div>
            </div>

            {/* Título y descripción */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {children}
      </div>

      {/* CTA Final */}
      {showCTA && (
        <>
          <Separator className="max-w-7xl mx-auto mb-16" />
          <section className="pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card 
                className="border-2 shadow-2xl overflow-hidden"
                style={{ borderColor: color }}
              >
                <CardHeader 
                  className="text-center pb-8"
                  style={{
                    background: `linear-gradient(135deg, ${color}10, transparent)`,
                  }}
                >
                  <CardTitle className="text-3xl md:text-4xl mb-4">
                    ¿Listo para Comenzar?
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Únete a miles de empresas que ya confían en TuPatrimonio
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <Link href={ctaHref}>
                    <Button
                      size="lg"
                      className="text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                      style={{
                        backgroundColor: color,
                      }}
                    >
                      {ctaText}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-sm text-gray-500 mt-4">
                    Sin tarjeta de crédito • Gratis para siempre • Cancela cuando quieras
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

