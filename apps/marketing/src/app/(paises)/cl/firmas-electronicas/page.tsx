import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CountrySelector } from '@tupatrimonio/location';
import { CheckCircle, Shield, Clock, Download, Users, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Firma Electrónica Chile - Válida Legalmente | TuPatrimonio",
  description: "Firma documentos online con validez legal en Chile. Reduce tiempos en 90%, cumple Ley 19.799, integración fácil. Prueba gratis 30 días.",
  keywords: ["firma electrónica chile", "firmar documentos online", "firma digital válida", "ley 19.799", "firma electrónica avanzada"],
  openGraph: {
    title: "Firma Electrónica Chile - Válida Legalmente | TuPatrimonio",
    description: "Firma documentos online con validez legal en Chile. Reduce tiempos en 90%, cumple Ley 19.799.",
    url: "https://tupatrimonio.app/cl/firmas-electronicas",
    images: [
      {
        url: "/firmas-electronicas-chile-og.jpg",
        width: 1200,
        height: 630,
        alt: "Firma Electrónica Chile - TuPatrimonio"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Firma Electrónica Chile - Válida Legalmente",
    description: "Firma documentos online con validez legal. Reduce tiempos en 90%, cumple Ley 19.799. Prueba gratis.",
    images: ["/firmas-electronicas-chile-og.jpg"],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/cl/firmas-electronicas",
  },
};

export default function FirmasElectronicasChilePage() {
  return (
    <div className="min-h-screen">
      {/* Header con selector de país */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[var(--tp-brand)]">TuPatrimonio Chile</h1>
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              🇨🇱 Chile
            </span>
          </div>
          <CountrySelector variant="minimal" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-background py-20">
        <div className="max-w-7xl tp-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="mb-6">
                <span className="text-[var(--tp-brand)]">Firma Electrónica</span><br />
                Válida Legalmente en Chile
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Reduce el tiempo de firma de documentos en un <strong>90%</strong>. 
                Cumple con la Ley 19.799 y tiene plena validez legal en Chile.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-4"
                >
                  Probar Gratis 30 Días
                </Button>
                <Button variant="outline" size="lg">
                  Ver Demostración
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>100% seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>Setup en 5 minutos</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 text-center">
                <Download className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-4" />
                <p className="text-muted-foreground">Video demostración</p>
                <p className="text-sm text-gray-500">Cómo firmar en 3 pasos simples</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Firma */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Tipos de Firma Electrónica
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ofrecemos diferentes niveles de seguridad según tus necesidades y requisitos legales
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Simple */}
            <div className="border border-border rounded-xl p-6 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="">Firma Simple</h3>
                <p className="text-muted-foreground mt-2">Para documentos internos</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Verificación por email</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Ideal para contratos internos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Implementación inmediata</span>
                </li>
              </ul>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">$500 CLP</p>
                <p className="text-sm text-muted-foreground">por documento</p>
              </div>
            </div>

            {/* Firma Avanzada */}
            <div className="border-2 border-[var(--tp-buttons)] rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[var(--tp-buttons)] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[var(--tp-buttons)]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-[var(--tp-brand)]" />
                </div>
                <h3 className="">Firma Avanzada</h3>
                <p className="text-muted-foreground mt-2">Para documentos comerciales</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Verificación SMS + Email</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Certificado digital incluido</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Validez legal reforzada</span>
                </li>
              </ul>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">$2.500 CLP</p>
                <p className="text-sm text-muted-foreground">por documento</p>
              </div>
            </div>

            {/* Firma Cualificada */}
            <div className="border border-border rounded-xl p-6 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="">Firma Cualificada</h3>
                <p className="text-muted-foreground mt-2">Máximo nivel de seguridad</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Verificación biométrica</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Certificado CA autorizada</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Para transacciones críticas</span>
                </li>
              </ul>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">$8.500 CLP</p>
                <p className="text-sm text-muted-foreground">por documento</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marco Legal Chileno */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Marco Legal en Chile
            </h2>
            <p className="text-xl text-muted-foreground">
              Cumplimos con toda la legislación chilena vigente
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-sm">
              <h3 className="mb-4">
                Ley 19.799 - Firma Electrónica
              </h3>
              <p className="text-muted-foreground mb-4">
                Establece el marco legal para el uso de firmas electrónicas en Chile, 
                garantizando su validez jurídica equivalente a la firma manuscrita.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Validez legal equivalente a firma manuscrita</li>
                <li>• Requisitos técnicos de seguridad</li>
                <li>• Certificación por entidades autorizadas</li>
              </ul>
            </div>
            
            <div className="bg-card p-8 rounded-xl shadow-sm">
              <h3 className="mb-4">
                Decreto 181/2002 - Reglamento
              </h3>
              <p className="text-muted-foreground mb-4">
                Reglamenta los aspectos técnicos y operativos de las firmas electrónicas, 
                definiendo los estándares de seguridad requeridos.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Estándares técnicos de implementación</li>
                <li>• Procedimientos de certificación</li>
                <li>• Requisitos para entidades certificadoras</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl tp-container text-center">
          <h2 className="text-white mb-4">
            Comienza a Firmar Digitalmente Hoy
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a más de 500 empresas chilenas que ya transformaron sus procesos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-card text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
            >
              Probar Gratis 30 Días
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-white border-white hover:bg-white/10 px-8 py-4"
            >
              Hablar con Ventas
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}