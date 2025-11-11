import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { CheckCircle, Shield, Clock, Users, MapPin, Building, Building2, Briefcase, Zap, Lock, FileSignature } from "lucide-react";
import { GoogleStatsMetrics } from "@/components/GoogleStatsDisplay";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TuPatrimonio Chile - Servicios Legales Digitales | Firma Electrónica, Modificaciones de Empresa, Notaría",
  description: "Servicios legales digitales en Chile: firma electrónica válida, modificaciones de empresa, notaría digital. Cumple legislación chilena. Prueba gratis.",
  keywords: ["firma electrónica chile", "modificaciones de empresa chile", "notaría digital chile", "documentos digitales chile", "ley 19.799"],
  openGraph: {
    title: "TuPatrimonio Chile - Servicios Legales Digitales",
    description: "Firma electrónica, modificaciones de empresa y notaría digital válidos en Chile. Cumple Ley 19.799.",
    url: "https://tupatrimonio.app/cl",
    locale: "es_CL",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/cl",
    languages: {
      'es-CL': '/cl',
      'es-CO': '/co', 
      'es-MX': '/mx',
    },
  },
};

export default function ChilePage() {
  return (
    <div className="min-h-screen">
      {/* Country Header */}
      <div className="bg-[var(--tp-buttons)]/5 dark:bg-[var(--tp-buttons)]/10 border-b border-border">
        <div className="max-w-7xl tp-container py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Icon icon={MapPin} size="sm" className="text-[var(--tp-buttons)]" />
              <span className="font-medium text-muted-foreground">Estás viendo TuPatrimonio para</span>
              <span className="font-bold text-[var(--tp-brand)]">Chile 🇨🇱</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>¿Otro país?</span>
              <Link href="/ar" className="text-[var(--tp-brand)] hover:underline">Argentina</Link>
              <span>•</span>
              <Link href="/co" className="text-[var(--tp-brand)] hover:underline">Colombia</Link>
              <span>•</span>
              <Link href="/mx" className="text-[var(--tp-brand)] hover:underline">México</Link>
              <span>•</span>
              <Link href="/pe" className="text-[var(--tp-brand)] hover:underline">Perú</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Chile-specific */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-background py-20">
        <div className="max-w-7xl tp-container">
          <div className="text-center">
            <h1 className="mb-6">
              Servicios Legales Digitales
              <span className="text-[var(--tp-brand)]"> para Chile</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto">
              Firma electrónica con validez legal según <strong>Ley 19.799</strong>, modificaciones de empresa y 
              notaría digital. Todo cumpliendo la normativa chilena.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://tupatrimon.io" target="_blank" rel="noopener noreferrer nofollow">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Empieza Gratis - Chile
                </Button>
              </a>
              <Link href="/cl/precios">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Ver Precios CLP
                </Button>
              </Link>
            </div>
            
            {/* Chile-specific stats */}
            <div className="mt-12 bg-gradient-to-br from-[var(--tp-brand-5)] to-[var(--tp-bg-light-20)] dark:from-[var(--tp-brand-5)] dark:to-transparent rounded-2xl p-8 md:p-12 border-2 border-[var(--tp-brand-20)]">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                {/* Métrica 1: Usuarios */}
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-[var(--tp-brand)] mb-2">+160K</div>
                  <p className="font-medium text-foreground">Usuarios Confían</p>
                  <p className="text-sm text-muted-foreground mt-1">Personas y empresas</p>
                </div>
                
                {/* Métrica 2: Google Stats (componente dinámico) */}
                <GoogleStatsMetrics />
                
                {/* Métrica 3: Validez Legal */}
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-[var(--tp-brand)] mb-2">100%</div>
                  <p className="font-medium text-foreground">Validez Legal</p>
                  <p className="text-sm text-muted-foreground mt-1">Cumple Ley 19.799</p>
                </div>
                
                {/* Métrica 4: Tiempo */}
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-[var(--tp-brand)] mb-2">24hrs</div>
                  <p className="font-medium text-foreground">Tiempo Promedio</p>
                  <p className="text-sm text-muted-foreground mt-1">Documentos listos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section Chile */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Servicios Específicos para Chile
            </h2>
            <p className="text-xl text-muted-foreground">
              Diseñados para cumplir la legislación y necesidades del mercado chileno
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Electrónica Chile */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={FileSignature} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>Firma Electrónica</CardTitle>
                <CardDescription className="mb-4">
                  Firma tus contratos y documentos desde casa. Con el mismo respaldo legal que si 
                  hubieras ido a la notaría. Cumple <strong>Ley 19.799</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/cl/firmas-electronicas">
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] transition-all"
                  >
                    Ver Detalles Chile
                  </Button>
                </Link>
              </CardContent>
            </Card>

{/* Notaría Digital Chile */}
<Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Briefcase} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>Notaría Digital</CardTitle>
                <CardDescription className="mb-4">
                  Legaliza documentos sin salir de casa. Autorización notarial de firmas 
                  y copias legalizadas válidas según <strong>código civil chileno</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/cl/notaria-online">
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] transition-all"
                  >
                    Ver Notaría Chile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Modificaciones de Empresa Chile */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Building2} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>Modificaciones de Empresa</CardTitle>
                <CardDescription className="mb-4">
                  Modifica tu empresa de forma 100% digital: cambios de razón social, aumentos de capital, 
                  modificaciones de directorio y más. <strong>Sin ir a la notaría</strong>.
                </CardDescription>
               
              </CardHeader>
              <CardContent>
                <Link href="/cl/modificaciones-empresa">
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] transition-all"
                  >
                    Ver Modificaciones de Empresa
                  </Button>
                </Link>
              </CardContent>
            </Card>

            
          </div>
        </div>
      </section>



      {/* CTA Chile */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] relative overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl tp-container text-center relative z-10">
          <h2 className="text-white mb-6">
            Únete a la Transformación Digital en Chile
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
            Más de 500 empresas chilenas ya digitalizaron sus procesos legales. Es tu turno de simplificar tus trámites.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <a href="https://tupatrimon.io" target="_blank" rel="noopener noreferrer nofollow">
              <Button 
                size="lg" 
                className="bg-white text-[var(--tp-brand)] hover:bg-gray-100 dark:hover:bg-gray-200 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Comenzar Gratis en Chile
              </Button>
            </a>
            <Link href="/cl/precios">
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white border-2 border-white hover:bg-white/10 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ver Precios en CLP
              </Button>
            </Link>
          </div>
          
          {/* Trust bar con iconos minimalistas */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon={CheckCircle} size="md" variant="white" />
              <span>Validez Legal Garantizada</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Zap} size="md" variant="white" />
              <span>Documentos en 24hrs</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Lock} size="md" variant="white" />
              <span>100% Seguro</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
