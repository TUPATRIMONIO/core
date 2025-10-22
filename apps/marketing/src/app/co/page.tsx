import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, Users, MapPin, Building, Briefcase } from "lucide-react";
import Link from "next/link";
import WaitlistForm from "@/components/forms/WaitlistForm";

export const metadata: Metadata = {
  title: "TuPatrimonio Colombia - Servicios Legales Digitales | Firma Electrónica, KYC, Notaría",
  description: "Servicios legales digitales en Colombia: firma electrónica válida, verificación de identidad, notaría digital. Cumple Ley 527/1999. Próximamente.",
  keywords: ["firma electrónica colombia", "kyc colombia", "notaría digital colombia", "ley 527 colombia"],
  openGraph: {
    title: "TuPatrimonio Colombia - Servicios Legales Digitales",
    description: "Firma electrónica y servicios legales digitales para Colombia. Próximamente disponible.",
    url: "https://tupatrimonio.app/co",
    locale: "es_CO",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/co",
    languages: {
      'es-CL': '/cl',
      'es-CO': '/co', 
      'es-MX': '/mx',
    },
  },
};

export default function ColombiaPage() {
  return (
    <div className="min-h-screen">
      {/* Country Header */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-gray-700">Estás viendo TuPatrimonio para</span>
              <span className="font-bold text-yellow-600">Colombia 🇨🇴</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>¿Otro país?</span>
              <Link href="/cl" className="text-[var(--tp-buttons)] hover:underline">Chile</Link>
              <span>•</span>
              <Link href="/mx" className="text-[var(--tp-buttons)] hover:underline">México</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Colombia */}
      <section className="bg-gradient-to-br from-yellow-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Servicios Legales Digitales
              <span className="text-yellow-600"> para Colombia</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Firma electrónica según <strong>Ley 527/1999</strong>, verificación de identidad y 
              notaría digital. Cumpliendo la normativa colombiana.
            </p>
            
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 rounded-full px-6 py-3 mb-8">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Próximamente disponible - Q1 2026</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 text-lg"
              >
                Únete a la Lista de Espera
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-yellow-600 text-yellow-600">
                Saber Más
              </Button>
            </div>
            
            {/* Colombia-specific indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Cumplirá Ley 527/1999</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Regulaciones SFC</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-green-600" />
                <span>Precios en COP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview Colombia */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Servicios para el Mercado Colombiano
            </h2>
            <p className="text-xl text-gray-600">
              Adaptados a la legislación y necesidades empresariales de Colombia
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Electrónica Colombia */}
            <div className="text-center p-6 rounded-lg border border-yellow-200 bg-yellow-50/30">
              <CheckCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Firma Electrónica</h3>
              <p className="text-gray-600 mb-4">
                Cumplirá <strong>Ley 527/1999</strong> de comercio electrónico. 
                Válida para contratos comerciales en Colombia.
              </p>
              <div className="text-sm text-yellow-700 font-medium">
                Desde $2,000 COP por documento
              </div>
            </div>

            <div className="text-center p-6 rounded-lg border border-yellow-200 bg-yellow-50/30">
              <Shield className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">KYC Colombia</h3>
              <p className="text-gray-600 mb-4">
                Verificación con <strong>cédulas colombianas</strong>. 
                Cumple regulaciones SFC para entidades financieras.
              </p>
              <div className="text-sm text-yellow-700 font-medium">
                Desde $8,000 COP por verificación
              </div>
            </div>

            <div className="text-center p-6 rounded-lg border border-yellow-200 bg-yellow-50/30">
              <Briefcase className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Notaría Digital</h3>
              <p className="text-gray-600 mb-4">
                Notarización digital según código civil colombiano. 
                Reconocimiento legal completo.
              </p>
              <div className="text-sm text-yellow-700 font-medium">
                Desde $25,000 COP por notarización
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section className="py-20 bg-yellow-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Sé de los Primeros en Colombia
            </h2>
            <p className="text-xl text-white/90">
              Únete a nuestra lista de espera y obtén acceso prioritario cuando lancemos
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <WaitlistForm 
              country="co" 
              source="colombia-homepage" 
              className="bg-white rounded-xl p-6"
            />
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm">
              🎁 Early access gratuito • 💰 Precios especiales de lanzamiento • 🇨🇴 Soporte en Colombia
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
