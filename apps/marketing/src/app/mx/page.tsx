import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, Users, MapPin, Building, Briefcase } from "lucide-react";
import Link from "next/link";
import WaitlistForm from "@/components/forms/WaitlistForm";

export const metadata: Metadata = {
  title: "TuPatrimonio México - Servicios Legales Digitales | Firma Electrónica, KYC, Notaría",
  description: "Servicios legales digitales en México: firma electrónica válida, verificación de identidad, notaría digital. Cumple NOM-151-SCFI. Próximamente.",
  keywords: ["firma electrónica méxico", "kyc méxico", "notaría digital méxico", "NOM-151-SCFI"],
  openGraph: {
    title: "TuPatrimonio México - Servicios Legales Digitales",
    description: "Firma electrónica y servicios legales digitales para México. Próximamente disponible.",
    url: "https://tupatrimonio.app/mx",
    locale: "es_MX",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/mx",
    languages: {
      'es-CL': '/cl',
      'es-CO': '/co', 
      'es-MX': '/mx',
    },
  },
};

export default function MexicoPage() {
  return (
    <div className="min-h-screen">
      {/* Country Header */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="font-medium text-gray-700">Estás viendo TuPatrimonio para</span>
              <span className="font-bold text-green-600">México 🇲🇽</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>¿Otro país?</span>
              <Link href="/cl" className="text-[var(--tp-buttons)] hover:underline">Chile</Link>
              <span>•</span>
              <Link href="/co" className="text-[var(--tp-buttons)] hover:underline">Colombia</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section México */}
      <section className="bg-gradient-to-br from-green-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Servicios Legales Digitales
              <span className="text-green-600"> para México</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Firma electrónica según <strong>NOM-151-SCFI</strong>, verificación de identidad y 
              notaría digital. Cumpliendo la normativa mexicana.
            </p>
            
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-300 rounded-full px-6 py-3 mb-8">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Próximamente disponible - Q2 2026</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
              >
                Únete a la Lista de Espera
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-green-600 text-green-600">
                Saber Más
              </Button>
            </div>
            
            {/* México-specific indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Cumplirá NOM-151-SCFI</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Regulaciones CNBV</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-green-600" />
                <span>Precios en MXN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview México */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Servicios para el Mercado Mexicano
            </h2>
            <p className="text-xl text-gray-600">
              Adaptados a la legislación y necesidades empresariales de México
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Electrónica México */}
            <div className="text-center p-6 rounded-lg border border-green-200 bg-green-50/30">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Firma Electrónica</h3>
              <p className="text-gray-600 mb-4">
                Cumplirá <strong>NOM-151-SCFI-2016</strong> sobre firma electrónica avanzada. 
                Válida para contratos en México.
              </p>
              <div className="text-sm text-green-700 font-medium">
                Desde $15 MXN por documento
              </div>
            </div>

            <div className="text-center p-6 rounded-lg border border-green-200 bg-green-50/30">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">KYC México</h3>
              <p className="text-gray-600 mb-4">
                Verificación con <strong>INE, CURP y RFC</strong>. 
                Cumple regulaciones CNBV para entidades financieras.
              </p>
              <div className="text-sm text-green-700 font-medium">
                Desde $65 MXN por verificación
              </div>
            </div>

            <div className="text-center p-6 rounded-lg border border-green-200 bg-green-50/30">
              <Briefcase className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Notaría Digital</h3>
              <p className="text-gray-600 mb-4">
                Notarización digital según código civil mexicano. 
                Reconocimiento en estados de la república.
              </p>
              <div className="text-sm text-green-700 font-medium">
                Desde $200 MXN por notarización
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mexico Market Opportunity */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué México Necesita Digitalización Legal?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">130M+</div>
              <p className="text-gray-600 font-medium mb-2">Población</p>
              <p className="text-sm text-gray-500">Mayor mercado de LATAM</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">2.1T</div>
              <p className="text-gray-600 font-medium mb-2">PIB (USD)</p>
              <p className="text-sm text-gray-500">Economía desarrollada</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">78%</div>
              <p className="text-gray-600 font-medium mb-2">Digitalización</p>
              <p className="text-sm text-gray-500">Adopción tecnológica alta</p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Sé Pionero en México
            </h2>
            <p className="text-xl text-white/90">
              Únete a nuestra lista de espera y obtén acceso VIP cuando lancemos en México
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <WaitlistForm 
              country="mx" 
              source="mexico-homepage" 
              className="bg-white rounded-xl p-6"
            />
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm">
              🎁 Acceso beta gratuito • 💰 Precios especiales de lanzamiento • 🇲🇽 Soporte en México
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
