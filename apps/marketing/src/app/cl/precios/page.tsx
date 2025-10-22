import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Crown, Users, Building, Calculator, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Precios TuPatrimonio - Planes Individuales y Empresariales | Chile",
  description: "Planes desde $0 para individuales y desde $49 para empresas. Firma electrónica, verificación de identidad y notaría digital. Sin costos ocultos.",
  keywords: ["precios firma electrónica", "planes verificación identidad", "costo notaría digital", "pricing b2b", "planes empresariales"],
  openGraph: {
    title: "Precios TuPatrimonio - Planes para Individuos y Empresas",
    description: "Planes desde $0 para individuales y desde $49 para empresas. Servicios legales digitales sin costos ocultos.",
    url: "https://tupatrimonio.app/precios",
    images: [
      {
        url: "/precios-og.jpg",
        width: 1200,
        height: 630,
        alt: "Precios TuPatrimonio - Planes"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios TuPatrimonio - Planes Individuales y Empresariales",
    description: "Desde $0 para individuales, desde $49 para empresas. Sin costos ocultos.",
    images: ["/precios-og.jpg"],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/precios",
  },
};

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Planes que se Adaptan a Ti
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Desde freelancers hasta grandes empresas. 
            Empieza gratis y escala según tus necesidades.
          </p>
          
          {/* Toggle Individual/Empresarial */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="bg-gray-100 p-1 rounded-lg">
              <div className="flex">
                <button className="px-6 py-2 rounded-md bg-[var(--tp-buttons)] text-white font-medium text-sm">
                  Individual
                </button>
                <button className="px-6 py-2 rounded-md text-gray-600 hover:text-gray-900 font-medium text-sm">
                  Empresarial
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              💰 <span className="font-medium text-green-600">Ahorra 20%</span> pagando anualmente
            </div>
          </div>
        </div>
      </section>

      {/* Planes Individuales (B2C) */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Personal Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Free</h3>
                <p className="text-gray-600">Para uso personal ocasional</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/mes</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>3 firmas electrónicas simples/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>1 verificación de identidad</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Soporte por email</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">Notaría digital</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">API access</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Comenzar Gratis
              </Button>
            </div>

            {/* Personal Pro */}
            <div className="bg-white rounded-2xl border-2 border-[var(--tp-buttons)] p-8 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[var(--tp-buttons)] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Pro</h3>
                <p className="text-gray-600">Para freelancers y profesionales</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">$9</span>
                  <span className="text-gray-600">/mes</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>20 firmas electrónicas/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>5 verificaciones de identidad</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>3 notarizaciones digitales</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Templates predefinidos</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>
              
              <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                Empezar 14 días gratis
              </Button>
            </div>

            {/* Personal Business */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-2xl font-bold text-gray-900">Personal Business</h3>
                </div>
                <p className="text-gray-600">Para profesionales intensivos</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600">/mes</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Firmas ilimitadas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>20 verificaciones/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>10 notarizaciones/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>API básico incluido</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Integración con CRM</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Empezar Prueba
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Separador para Planes Empresariales */}
      <section className="py-12 bg-[var(--tp-buttons)]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Planes Empresariales
          </h2>
          <p className="text-xl text-gray-600">
            Para equipos y organizaciones que necesitan colaboración y gestión avanzada
          </p>
        </div>
      </section>

      {/* Planes Empresariales (B2B) */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Team Starter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <Users className="w-8 h-8 text-[var(--tp-buttons)] mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Team Starter</h3>
                <p className="text-gray-600">Para equipos pequeños</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">$49</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">hasta 5 usuarios</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>200 firmas/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>50 verificaciones/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>20 notarizaciones/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Gestión de equipos</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Dashboard centralizado</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>API incluido</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Empezar Team Trial
              </Button>
            </div>

            {/* Business */}
            <div className="bg-white rounded-2xl border-2 border-[var(--tp-buttons)] p-8 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[var(--tp-buttons)] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Empresas
                </span>
              </div>
              
              <div className="text-center mb-8">
                <Building className="w-8 h-8 text-[var(--tp-buttons)] mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
                <p className="text-gray-600">Para empresas medianas</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">$199</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">hasta 25 usuarios</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Firmas ilimitadas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>500 verificaciones/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>100 notarizaciones/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Workflows automatizados</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Integraciones avanzadas</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Soporte dedicado</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Analytics y reportes</span>
                </li>
              </ul>
              
              <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                Empezar 30 días gratis
              </Button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <Crown className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600">Para grandes corporaciones</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">Custom</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">según necesidades</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Todo ilimitado</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Usuarios ilimitados</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>SLA garantizado 99.9%</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Implementación personalizada</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Account manager dedicado</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Compliance personalizado</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>White label disponible</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Contactar Ventas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Calculadora de ROI */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
            <Calculator className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Calcula tu Ahorro Anual
            </h2>
            <p className="text-gray-600 mb-6">
              Estima cuánto ahorrarás digitalizando tus procesos documentales
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <label className="text-sm font-medium text-gray-700">Firmas por mes</label>
                <div className="mt-1 p-3 border rounded-lg bg-white">
                  <span className="text-gray-600">~50 documentos</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Método actual</label>
                <div className="mt-1 p-3 border rounded-lg bg-white">
                  <span className="text-gray-600">Presencial</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ahorro estimado</label>
                <div className="mt-1 p-3 border-2 border-green-500 rounded-lg bg-green-50">
                  <span className="text-green-700 font-bold">$245,000 CLP/año</span>
                </div>
              </div>
            </div>
            
            <Button className="mt-6 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              Calcular mi Ahorro Exacto
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ sobre Facturación */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Preguntas sobre Facturación
            </h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-gray-600">
                Sí, puedes upgrader o downgrader tu plan cuando quieras. Los cambios se aplican 
                inmediatamente y solo pagas la diferencia prorrateada.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Qué pasa si excedo mi límite mensual?
              </h3>
              <p className="text-gray-600">
                Ofrecemos créditos adicionales: $0.50 por firma extra, $2.50 por verificación extra, 
                $6.00 por notarización extra. O puedes upgradear tu plan automáticamente.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Ofrecen descuentos por volumen?
              </h3>
              <p className="text-gray-600">
                Sí, para empresas con más de 1,000 transacciones mensuales ofrecemos descuentos 
                significativos. Contacta nuestro equipo comercial para una cotización personalizada.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600">
                Tarjetas de crédito/débito, transferencia bancaria, Khipu, Mercado Pago y 
                otros métodos locales. Facturación automática mensual o anual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comienza tu Transformación Digital
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Sin compromiso, sin configuración compleja, sin costos ocultos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
            >
              Probar Gratis 14 Días
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
