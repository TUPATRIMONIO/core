import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, Download, Users, Star } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Firma Electrónica Chile - Válida Legalmente | TuPatrimonio",
  description: "Firma documentos online con validez legal en Chile. Reduce tiempos en 90%, cumple Ley 19.799, integración fácil. Prueba gratis 30 días.",
  keywords: ["firma electrónica chile", "firmar documentos online", "firma digital válida", "ley 19.799", "firma electrónica avanzada"],
  openGraph: {
    title: "Firma Electrónica Chile - Válida Legalmente | TuPatrimonio",
    description: "Firma documentos online con validez legal en Chile. Reduce tiempos en 90%, cumple Ley 19.799.",
    url: "https://tupatrimonio.app/firmas-electronicas",
    images: [
      {
        url: "/firmas-electronicas-og.jpg",
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
    images: ["/firmas-electronicas-og.jpg"],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/firmas-electronicas",
  },
};

export default function FirmasElectronicasPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="text-[var(--tp-buttons)]">Firma Electrónica</span><br />
                Válida Legalmente en Chile
              </h1>
              <p className="text-xl text-gray-600 mb-8">
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
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
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
              {/* Placeholder para imagen/video */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 text-center">
                <Download className="w-16 h-16 text-[var(--tp-buttons)] mx-auto mb-4" />
                <p className="text-gray-600">Video demostración</p>
                <p className="text-sm text-gray-500">Cómo firmar en 3 pasos simples</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Firma */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tipos de Firma Electrónica
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ofrecemos diferentes niveles de seguridad según tus necesidades y requisitos legales
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Simple */}
            <div className="border border-gray-200 rounded-xl p-6 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Firma Simple</h3>
                <p className="text-gray-600 mt-2">Para documentos internos</p>
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
                <p className="text-2xl font-bold text-gray-900">$0.50</p>
                <p className="text-sm text-gray-600">por documento</p>
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
                  <Shield className="w-6 h-6 text-[var(--tp-buttons)]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Firma Avanzada</h3>
                <p className="text-gray-600 mt-2">Para documentos comerciales</p>
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
                <p className="text-2xl font-bold text-gray-900">$2.50</p>
                <p className="text-sm text-gray-600">por documento</p>
              </div>
            </div>

            {/* Firma Cualificada */}
            <div className="border border-gray-200 rounded-xl p-6 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Firma Cualificada</h3>
                <p className="text-gray-600 mt-2">Máximo nivel de seguridad</p>
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
                <p className="text-2xl font-bold text-gray-900">$8.50</p>
                <p className="text-sm text-gray-600">por documento</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir TuPatrimonio?
            </h2>
            <p className="text-xl text-gray-600">
              La solución más completa y confiable del mercado
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[var(--tp-buttons)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">100% Legal</h3>
              <p className="text-gray-600">Cumple Ley 19.799 y normativas chilenas</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-[var(--tp-buttons)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Súper Rápido</h3>
              <p className="text-gray-600">Reduce tiempo de firma en 90%</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[var(--tp-buttons)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Para Equipos</h3>
              <p className="text-gray-600">Gestión centralizada y colaborativa</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[var(--tp-buttons)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fácil Integración</h3>
              <p className="text-gray-600">API REST y webhooks incluidos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Casos de Uso */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Documentos que Puedes Firmar
            </h2>
            <p className="text-xl text-gray-600">
              Desde contratos simples hasta documentos legales complejos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Contratos de Trabajo",
              "NDAs y Confidencialidad", 
              "Contratos Comerciales",
              "Poderes Legales",
              "Contratos de Arriendo",
              "Acuerdos de Servicios",
              "Contratos de Venta",
              "Documentos Notariales",
              "Actas de Reuniones"
            ].map((documento, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[var(--tp-buttons)] flex-shrink-0" />
                <span className="font-medium text-gray-900">{documento}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Lo que Dicen Nuestros Clientes
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "TuPatrimonio nos permitió digitalizar completamente nuestro proceso de firma de contratos. 
                Lo que antes tomaba días, ahora lo resolvemos en minutos."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">María González</div>
                  <div className="text-sm text-gray-600">CEO, StartupTech SpA</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                "La validez legal está garantizada y el proceso es súper intuitivo. 
                Nuestros clientes están encantados con la experiencia."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">Carlos Mendoza</div>
                  <div className="text-sm text-gray-600">Socio, Legal Corp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Tiene validez legal la firma electrónica en Chile?
              </h3>
              <p className="text-gray-600">
                Sí, las firmas electrónicas tienen plena validez legal en Chile según la Ley 19.799 
                sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación. 
                TuPatrimonio cumple con todos los requisitos técnicos y legales establecidos.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Qué documentos puedo firmar electrónicamente?
              </h3>
              <p className="text-gray-600">
                Puedes firmar la mayoría de documentos comerciales y civiles, incluyendo contratos, 
                NDAs, poderes, acuerdos comerciales y más. Solo algunos documentos específicos como 
                testamentos requieren firma presencial según la ley chilena.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Cómo garantizan la seguridad?
              </h3>
              <p className="text-gray-600">
                Utilizamos encriptación end-to-end, certificados digitales, verificación de identidad 
                biométrica y cumplimos con estándares internacionales de seguridad. 
                Cada firma incluye un certificado de autenticidad verificable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comienza a Firmar Digitalmente Hoy
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a más de 500 empresas que ya transformaron sus procesos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
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
