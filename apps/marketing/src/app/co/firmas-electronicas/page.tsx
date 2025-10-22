import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CountrySelector } from '../../../../../../packages/location/src/components/CountrySelector';
import { CheckCircle, Shield, Clock, Download, Users, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Firma Electrónica Colombia - Válida Legalmente | TuPatrimonio",
  description: "Firma documentos online con validez legal en Colombia. Cumple Ley 527/1999, reduce tiempos 90%. Próximamente disponible.",
  keywords: ["firma electrónica colombia", "firma digital colombia", "ley 527", "documentos digitales colombia"],
  openGraph: {
    title: "Firma Electrónica Colombia - Válida Legalmente | TuPatrimonio",
    description: "Firma documentos online con validez legal en Colombia. Cumple Ley 527/1999.",
    url: "https://tupatrimonio.app/co/firmas-electronicas",
    images: [
      {
        url: "/firmas-electronicas-colombia-og.jpg",
        width: 1200,
        height: 630,
        alt: "Firma Electrónica Colombia - TuPatrimonio"
      }
    ],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/co/firmas-electronicas",
  },
};

export default function FirmasElectronicasColombiaPage() {
  return (
    <div className="min-h-screen">
      {/* Header con selector de país */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[var(--tp-brand)]">TuPatrimonio Colombia</h1>
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              🇨🇴 Colombia
            </span>
          </div>
          <CountrySelector variant="minimal" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block">
                🚀 Próximamente en Colombia
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="text-[var(--tp-brand)]">Firma Electrónica</span><br />
                Válida Legalmente en Colombia
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Reduce el tiempo de firma de documentos en un <strong>90%</strong>. 
                Cumple con la Ley 527 de 1999 y tiene plena validez legal en Colombia.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-4"
                >
                  Únete a Lista de Espera
                </Button>
                <Button variant="outline" size="lg">
                  Más Información
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Notificación prioritaria</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Cumple Ley 527/1999</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>Lanzamiento 2024</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-100 to-blue-100 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">🇨🇴</div>
                <p className="text-gray-600 font-medium">Próximamente disponible</p>
                <p className="text-sm text-gray-500">Estamos trabajando para llegar pronto a Colombia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precios Colombia */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Precios para Colombia
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Precios competitivos en pesos colombianos (COP)
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Simple */}
            <div className="border border-gray-200 rounded-xl p-6 opacity-60">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Firma Simple</h3>
                <p className="text-gray-600 mt-2">Para documentos internos</p>
              </div>
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-gray-900">$2.000 COP</p>
                <p className="text-sm text-gray-600">por documento</p>
              </div>
              <div className="bg-gray-100 text-gray-500 text-center py-2 rounded-lg">
                Próximamente
              </div>
            </div>

            {/* Firma Avanzada */}
            <div className="border-2 border-[var(--tp-buttons)] rounded-xl p-6 relative opacity-60">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[var(--tp-buttons)] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Firma Avanzada</h3>
                <p className="text-gray-600 mt-2">Para documentos comerciales</p>
              </div>
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-gray-900">$10.000 COP</p>
                <p className="text-sm text-gray-600">por documento</p>
              </div>
              <div className="bg-gray-100 text-gray-500 text-center py-2 rounded-lg">
                Próximamente
              </div>
            </div>

            {/* Firma Cualificada */}
            <div className="border border-gray-200 rounded-xl p-6 opacity-60">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Firma Cualificada</h3>
                <p className="text-gray-600 mt-2">Máximo nivel de seguridad</p>
              </div>
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-gray-900">$25.000 COP</p>
                <p className="text-sm text-gray-600">por documento</p>
              </div>
              <div className="bg-gray-100 text-gray-500 text-center py-2 rounded-lg">
                Próximamente
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marco Legal Colombiano */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Marco Legal en Colombia
            </h2>
            <p className="text-xl text-gray-600">
              Cumpliremos con toda la legislación colombiana vigente
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ley 527 de 1999
              </h3>
              <p className="text-gray-600 mb-4">
                Define y reglamenta el acceso y uso de los mensajes de datos, del comercio 
                electrónico y de las firmas digitales en Colombia.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Validez jurídica de mensajes de datos</li>
                <li>• Firma digital y certificados</li>
                <li>• Entidades de certificación</li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Decreto 2364 de 2012
              </h3>
              <p className="text-gray-600 mb-4">
                Reglamenta la Ley 527 de 1999 y establece los requisitos para las 
                firmas electrónicas y digitales en Colombia.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Tipos de firmas electrónicas</li>
                <li>• Entidades de certificación digital</li>
                <li>• Procedimientos y estándares técnicos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Espera CTA */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¡Pronto en Colombia! 🇨🇴
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a nuestra lista de espera y sé de los primeros en acceder cuando lancemos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
            >
              Unirme a Lista de Espera
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-white border-white hover:bg-white/10 px-8 py-4"
            >
              Notificarme por Email
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
