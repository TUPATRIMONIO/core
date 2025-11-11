import type { Metadata } from "next";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { Fingerprint, Clock, Zap, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Verificación de Identidad Digital - Próximamente | TuPatrimonio",
  description: "Estamos trabajando en nuestra solución de verificación de identidad digital. Pronto podrás verificar usuarios con biometría avanzada.",
  alternates: {
    canonical: "https://tupatrimonio.app/verificacion-identidad",
  },
};

export default function VerificacionIdentidadPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--tp-background-light)] via-background to-background py-20">
      <div className="max-w-3xl tp-container text-center">
        
        {/* Icono Principal con Animación */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[var(--tp-brand)]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative">
              <IconContainer 
                icon={Fingerprint} 
                variant="solid-brand" 
                shape="rounded" 
                size="lg"
                className="shadow-2xl scale-150"
              />
            </div>
          </div>
        </div>

        {/* Badge Próximamente */}
        <div className="inline-flex items-center gap-2 bg-[var(--tp-brand)]/10 dark:bg-[var(--tp-brand)]/20 px-4 py-2 rounded-full mb-6">
          <Icon icon={Clock} size="sm" className="text-[var(--tp-brand)]" />
          <span className="text-[var(--tp-brand)] font-semibold text-sm">Próximamente</span>
        </div>

        {/* Título */}
        <h1 className="mb-6">
          <span className="text-[var(--tp-brand)]">Verificación de Identidad</span>
        </h1>
        
        {/* Descripción - Tono cercano y empático */}
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Estamos construyendo algo increíble para ti. Muy pronto podrás verificar la identidad 
          de tus usuarios de forma <strong>simple y segura</strong>, sin complicaciones técnicas.
        </p>

        {/* Preview de Características - Cards con Icons */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-2xl mx-auto mb-12">
          <Card className="bg-card border-2 border-border p-6 hover:border-[var(--tp-brand)] transition-all group">
            <div className="mb-4 group-hover:scale-110 transition-transform">
              <IconContainer 
                icon={Zap} 
                variant="brand" 
                shape="rounded" 
                size="lg"
              />
            </div>
            <p className="font-semibold text-foreground">Verificación rápida</p>
            <p className="text-sm text-muted-foreground mt-1">En solo 1 minuto</p>
          </Card>

          <Card className="bg-card border-2 border-border p-6 hover:border-[var(--tp-brand)] transition-all group">
            <div className="mb-4 group-hover:scale-110 transition-transform">
              <IconContainer 
                icon={Shield} 
                variant="brand" 
                shape="rounded" 
                size="lg"
              />
            </div>
            <p className="font-semibold text-foreground">Alta precisión</p>
            <p className="text-sm text-muted-foreground mt-1">95% de exactitud</p>
          </Card>

          <Card className="bg-card border-2 border-border p-6 hover:border-[var(--tp-brand)] transition-all group">
            <div className="mb-4 group-hover:scale-110 transition-transform">
              <IconContainer 
                icon={CheckCircle} 
                variant="brand" 
                shape="rounded" 
                size="lg"
              />
            </div>
            <p className="font-semibold text-foreground">100% legal</p>
            <p className="text-sm text-muted-foreground mt-1">Cumple regulaciones</p>
          </Card>
        </div>

        {/* Formulario de Waitlist */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            ¿Quieres que te avisemos cuando esté lista?
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Déjanos tu email y serás el primero en probarlo
          </p>
          <WaitlistForm 
            source="verificacion-identidad-page"
            useCase="business"
          />
        </div>

        {/* Mensaje de Tranquilidad (ADN de marca) */}
        <div className="max-w-xl mx-auto mb-10">
          <p className="text-sm text-muted-foreground italic">
            Nos tomamos el tiempo necesario para crear algo que realmente funcione 
            y te dé la <strong className="text-foreground">tranquilidad</strong> que mereces.
          </p>
        </div>

        {/* Volver al inicio */}
        <div className="pt-8 border-t border-border">
          <Button 
            variant="ghost"
            className="text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] hover:bg-[var(--tp-brand)]/5"
            asChild
          >
            <a href="/" className="inline-flex items-center gap-2">
              <Icon icon={ArrowLeft} size="sm" variant="inherit" />
              <span>Volver al inicio</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
