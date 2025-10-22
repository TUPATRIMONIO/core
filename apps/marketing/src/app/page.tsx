import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, Users, Globe } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Digitaliza tus Procesos
              <span className="text-[var(--tp-brand)]"> Legales</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Firmas electrónicas válidas, verificación de identidad biométrica y notaría digital. 
              Todo en una plataforma segura y fácil de usar.
            </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cl">
                  <Button 
                    size="lg" 
                    className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-4 text-lg"
                  >
                    Empieza Gratis en Chile
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Ver Demo
                </Button>
              </div>
              
              {/* Country Selector */}
              <div className="mt-8">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white/80 rounded-full px-4 py-2">
                  <Globe className="w-4 h-4" />
                  <span>También disponible en:</span>
                  <Link href="/co" className="text-[var(--tp-buttons)] hover:underline font-medium">Colombia</Link>
                  <span>•</span>
                  <Link href="/mx" className="text-[var(--tp-buttons)] hover:underline font-medium">México</Link>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Servicios Legales Digitales
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas para modernizar tus procesos legales
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Electrónica */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[var(--tp-brand)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Firmas Electrónicas</h3>
              <p className="text-gray-600 mb-4">
                Firma documentos de forma segura y con validez legal. Reduce tiempos de gestión en un 90%.
              </p>
              <Link href="/cl/firmas-electronicas">
                <Button variant="outline" className="w-full">
                  Conocer Más
                </Button>
              </Link>
            </div>

            {/* Verificación de Identidad */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[var(--tp-brand)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Verificación de Identidad</h3>
              <p className="text-gray-600 mb-4">
                Verifica usuarios con biometría y documentos oficiales en menos de 3 minutos.
              </p>
              <Link href="/cl/verificacion-identidad">
                <Button variant="outline" className="w-full">
                  Conocer Más
                </Button>
              </Link>
            </div>

            {/* Notaría Digital */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-[var(--tp-brand)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Notaría Digital</h3>
              <p className="text-gray-600 mb-4">
                Notariza documentos online con validez legal completa. Sin filas ni trámites presenciales.
              </p>
              <Link href="/cl/notaria-digital">
                <Button variant="outline" className="w-full">
                  Conocer Más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-[var(--tp-background-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[var(--tp-buttons)]" />
              <span className="text-lg font-semibold">+500 Empresas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-[var(--tp-buttons)]" />
              <span className="text-lg font-semibold">+10,000 Documentos Firmados</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[var(--tp-buttons)]" />
              <span className="text-lg font-semibold">100% Seguro</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Empresas que confían en <span className="text-[var(--tp-brand)]">TuPatrimonio</span>
          </h2>
          
          {/* Placeholder para logos de clientes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            {["StartupTech", "Legal Corp", "Inmobiliaria Sur", "FinTech Pro"].map((company) => (
              <div key={company} className="text-center">
                <div className="h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-medium">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para digitalizar tu empresa?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a más de 500 empresas que ya digitalizaron sus procesos legales
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-white text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4 text-lg"
          >
            Comenzar Ahora - Es Gratis
          </Button>
        </div>
      </section>
    </div>
  );
}
