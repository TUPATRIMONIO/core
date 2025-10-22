import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, Users, MapPin, Building, Briefcase } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TuPatrimonio Chile - Servicios Legales Digitales | Firma Electrónica, KYC, Notaría",
  description: "Servicios legales digitales en Chile: firma electrónica válida, verificación de identidad KYC, notaría digital. Cumple legislación chilena. Prueba gratis.",
  keywords: ["firma electrónica chile", "kyc chile", "notaría digital chile", "documentos digitales chile", "ley 19.799"],
  openGraph: {
    title: "TuPatrimonio Chile - Servicios Legales Digitales",
    description: "Firma electrónica, verificación de identidad y notaría digital válidos en Chile. Cumple Ley 19.799.",
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
      <div className="bg-[var(--tp-buttons)]/5 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[var(--tp-buttons)]" />
              <span className="font-medium text-gray-700">Estás viendo TuPatrimonio para</span>
              <span className="font-bold text-[var(--tp-buttons)]">Chile 🇨🇱</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>¿Otro país?</span>
              <Link href="/co" className="text-[var(--tp-buttons)] hover:underline">Colombia</Link>
              <span>•</span>
              <Link href="/mx" className="text-[var(--tp-buttons)] hover:underline">México</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Chile-specific */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Servicios Legales Digitales
              <span className="text-[var(--tp-buttons)]"> para Chile</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Firma electrónica con validez legal según <strong>Ley 19.799</strong>, verificación de identidad KYC y 
              notaría digital. Todo cumpliendo la normativa chilena.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-4 text-lg"
              >
                Empieza Gratis - Chile
              </Button>
              <Link href="/cl/precios">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Ver Precios CLP
                </Button>
              </Link>
            </div>
            
            {/* Chile-specific trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Cumple Ley 19.799</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Regulaciones CMF</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-green-600" />
                <span>+200 empresas chilenas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section Chile */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Servicios Específicos para Chile
            </h2>
            <p className="text-xl text-gray-600">
              Diseñados para cumplir la legislación y necesidades del mercado chileno
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Electrónica Chile */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[var(--tp-buttons)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Firma Electrónica</h3>
              <p className="text-gray-600 mb-4">
                Cumple <strong>Ley 19.799</strong>. Válida en tribunales chilenos. 
                Integración con SII y registro civil.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Desde $500 CLP por documento
              </div>
              <Link href="/cl/firmas-electronicas">
                <Button variant="outline" className="w-full">
                  Ver Detalles Chile
                </Button>
              </Link>
            </div>

            {/* Verificación KYC Chile */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[var(--tp-buttons)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">KYC & Verificación</h3>
              <p className="text-gray-600 mb-4">
                Verificación biométrica con <strong>cédulas chilenas</strong>. 
                Cumple regulaciones CMF y SBIF.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Desde $2.500 CLP por verificación
              </div>
              <Link href="/cl/verificacion-identidad">
                <Button variant="outline" className="w-full">
                  Ver KYC Chile
                </Button>
              </Link>
            </div>

            {/* Notaría Digital Chile */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-[var(--tp-buttons)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Notaría Digital</h3>
              <p className="text-gray-600 mb-4">
                Notarización online válida según <strong>código civil chileno</strong>. 
                Reconocida por tribunales.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Desde $6.000 CLP por notarización
              </div>
              <Link href="/cl/notaria-digital">
                <Button variant="outline" className="w-full">
                  Ver Notaría Chile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Chile Market Focus */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Diseñado Específicamente para Chile
            </h2>
            <p className="text-xl text-gray-600">
              Entendemos el mercado chileno y sus regulaciones únicas
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-white font-bold">
                📋
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Legislación Local</h3>
              <p className="text-gray-600">
                Cumple Ley 19.799, regulaciones CMF, SBIF y código civil chileno. 
                Actualizado con últimas normativas.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-white font-bold">
                🏛️
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Integración SII</h3>
              <p className="text-gray-600">
                Conectividad directa con Servicio de Impuestos Internos 
                para validación de RUT y datos empresariales.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-white font-bold">
                ⚖️
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Validez Tribunales</h3>
              <p className="text-gray-600">
                Documentos aceptados en tribunales chilenos. 
                Casos de éxito en Corte Suprema y tribunales civiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chile Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Empresas Chilenas que Confían en TuPatrimonio
          </h2>
          
          {/* Placeholder para logos de empresas chilenas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {["BancoChile", "StartupCL", "InmobiliariaRM", "FinTechSantiago"].map((company) => (
              <div key={company} className="text-center">
                <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-medium">{company}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--tp-buttons)] mb-2">+500</div>
                <p className="text-gray-600">Empresas chilenas</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--tp-buttons)] mb-2">+15,000</div>
                <p className="text-gray-600">Documentos firmados</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--tp-buttons)] mb-2">99.8%</div>
                <p className="text-gray-600">Uptime garantizado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Chile */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Únete a la Transformación Digital en Chile
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Más de 500 empresas chilenas ya digitalizaron sus procesos legales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
            >
              Comenzar Gratis en Chile
            </Button>
            <Link href="/cl/precios">
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-white border-white hover:bg-white/10 px-8 py-4"
              >
                Ver Precios en CLP
              </Button>
            </Link>
            <Link href="/cl/contacto">
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-white border-white hover:bg-white/10 px-8 py-4"
              >
                Hablar con Especialista
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm">
              💰 Precios en pesos chilenos • 🏛️ Cumple legislación local • 🇨🇱 Soporte en horario chileno
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
