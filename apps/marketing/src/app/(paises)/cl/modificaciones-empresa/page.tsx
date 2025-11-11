import type { Metadata } from "next";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { Building2, Clock, Zap, Shield, CheckCircle, ArrowLeft, FileSignature, FileCheck, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Modificaciones de Sociedad por Acciones (SpA) | TuPatrimonio Chile",
  description: "Modifica tu SpA de forma 100% digital en menos de 24 horas. Autorización notarial rápida para cambios de razón social, aumentos de capital y más.",
  keywords: ["modificaciones spa chile", "spa modificaciones", "modificación sociedad por acciones", "modificar spa"],
  alternates: {
    canonical: "https://tupatrimonio.app/cl/modificaciones-empresa",
  },
};

export default function ModificacionesEmpresaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] via-background to-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[var(--tp-brand)]/10 dark:bg-[var(--tp-brand)]/20 px-4 py-2 rounded-full mb-6 border border-[var(--tp-brand)]/20">
              <Icon icon={Zap} size="sm" className="text-[var(--tp-brand)]" />
              <span className="text-sm font-semibold text-[var(--tp-brand)]">Oferta Especial</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
              Modificaciones de <span className="text-[var(--tp-brand)]">SpA</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-2">
              Tu Empresa en un Día
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Autorización notarial rápida y 100% digital para las modificaciones de tu Sociedad por Acciones
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl tp-container">
          <Card className="border-2 border-[var(--tp-brand)] shadow-2xl overflow-hidden bg-card">
            <CardHeader className="bg-card border-b border-border text-center py-10">
              <div className="mb-4">
                <IconContainer 
                  icon={Building2} 
                  variant="solid-brand" 
                  shape="rounded" 
                  size="lg"
                  className="mx-auto"
                />
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Firma Notarial - Modificaciones de SpA
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                Servicio express para tu empresa
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 md:p-12 bg-card">
              {/* Precio */}
              <div className="bg-[var(--tp-background-light)] dark:bg-muted/20 rounded-2xl p-8 text-center mb-8 border border-border">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Precio Especial</span>
                </div>
                <div className="flex items-end justify-center gap-3 mb-3">
                  <span className="text-5xl md:text-6xl font-bold text-[var(--tp-brand)]">$16.900</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">$19.900</span>
                  <span className="bg-[var(--tp-brand)] text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md">
                    Ahorra $3.000
                  </span>
                </div>
              </div>

              {/* Características */}
              <div className="space-y-6 mb-8">
                <h3 className="text-xl font-bold text-center mb-6 text-foreground">¿Qué incluye este servicio?</h3>
                
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-5 bg-background dark:bg-muted/20 rounded-xl border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-lg transition-all">
                    <div className="flex-shrink-0">
                      <IconContainer 
                        icon={Zap} 
                        variant="brand" 
                        shape="rounded" 
                        size="md"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1.5 text-foreground">Autorización Notarial Rápida</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Recibe la autorización notarial de la modificación de tu SpA en tiempo récord
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-background dark:bg-muted/20 rounded-xl border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-lg transition-all">
                    <div className="flex-shrink-0">
                      <IconContainer 
                        icon={Clock} 
                        variant="brand" 
                        shape="rounded" 
                        size="md"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1.5 text-foreground">Entrega en menos de 24 horas hábiles</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Tu empresa modificada en tiempo récord, sin esperas ni complicaciones
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-background dark:bg-muted/20 rounded-xl border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-lg transition-all">
                    <div className="flex-shrink-0">
                      <IconContainer 
                        icon={FileCheck} 
                        variant="brand" 
                        shape="rounded" 
                        size="md"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1.5 text-foreground">Para documentos ya protocolizados</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Ideal cuando ya tienes todos los documentos protocolizados y solo necesitas la autorización de un notario para confirmar las modificaciones realizadas a tu SpA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <Link href="https://tupatrimon.io/modificaciones-de-spa-tu-empresa-en-un-dia/" target="_blank" rel="noopener noreferrer nofollow">
                  <Button 
                    className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-buttons-hover)] text-white py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                    size="lg"
                  >
                    Empezar Ahora
                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                  </Button>
                </Link>
                
                <p className="text-center text-sm text-muted-foreground">
                  <Icon icon={Shield} size="sm" variant="inherit" className="inline mr-1" />
                  100% seguro • Validez legal garantizada • Sin costos ocultos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      

      {/* Volver al inicio */}
      <section className="py-12 border-t border-border">
        <div className="max-w-7xl tp-container text-center">
          <Button 
            variant="ghost"
            className="text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] hover:bg-[var(--tp-brand)]/5"
            asChild
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio</span>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

