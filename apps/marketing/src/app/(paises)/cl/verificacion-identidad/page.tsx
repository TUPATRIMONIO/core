import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, Zap, Users, Star, Eye, Fingerprint } from "lucide-react";

export const metadata: Metadata = {
  title: "Verificación de Identidad Digital Chile - KYC Biométrico | TuPatrimonio",
  description: "Verifica identidad de usuarios con biometría y documentos oficiales. KYC digital en 3 minutos, cumple regulaciones chilenas. Ideal para fintechs y compliance.",
  keywords: ["verificación identidad digital", "kyc digital chile", "verificación biométrica", "onboarding digital", "compliance chile"],
  openGraph: {
    title: "Verificación de Identidad Digital Chile - KYC Biométrico | TuPatrimonio",
    description: "Verifica identidad con biometría y documentos oficiales. KYC digital en 3 minutos, cumple regulaciones.",
    url: "https://tupatrimonio.app/verificacion-identidad",
    images: [
      {
        url: "/verificacion-identidad-og.jpg",
        width: 1200,
        height: 630,
        alt: "Verificación de Identidad Digital - TuPatrimonio"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verificación de Identidad Digital Chile - KYC Biométrico",
    description: "Verifica identidad con biometría. KYC digital en 3 minutos, cumple regulaciones chilenas.",
    images: ["/verificacion-identidad-og.jpg"],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/verificacion-identidad",
  },
};

export default function VerificacionIdentidadPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="mb-6">
                <span className="text-[var(--tp-brand)]">Verificación de Identidad</span><br />
                Digital en 3 Minutos
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Verifica usuarios con <strong>biometría avanzada</strong> y documentos oficiales. 
                Cumple regulaciones chilenas y reduce fraude en un <strong>95%</strong>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-4"
                >
                  Probar Verificación Gratis
                </Button>
                <Button variant="outline" size="lg">
                  Ver Demo en Vivo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>3 min promedio</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>95% precisión</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span>API instantánea</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Placeholder para imagen/video */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-8 text-center">
                <Fingerprint className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Verificación Biométrica</p>
                <p className="text-sm text-muted-foreground">Selfie + Documento en vivo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Verificación */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Tipos de Verificación Disponibles
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Desde verificación básica hasta KYC completo para instituciones financieras
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Verificación Básica */}
            <div className="border border-border rounded-xl p-6 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="">Verificación Básica</h3>
                <p className="text-muted-foreground mt-2">Para registro de usuarios</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Selfie + Documento</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Verificación automática</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Resultado en 30 segundos</span>
                </li>
              </ul>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">$2.50</p>
                <p className="text-sm text-muted-foreground">por verificación</p>
              </div>
            </div>

            {/* KYC Completo */}
            <div className="border-2 border-[var(--tp-buttons)] rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[var(--tp-buttons)] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Usado
                </span>
              </div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[var(--tp-buttons)]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-[var(--tp-buttons)]" />
                </div>
                <h3 className="">KYC Completo</h3>
                <p className="text-muted-foreground mt-2">Para fintechs y bancos</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Biometría + Liveness Detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Verificación de documentos IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Cumple regulaciones CMF</span>
                </li>
              </ul>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">$8.50</p>
                <p className="text-sm text-muted-foreground">por verificación</p>
              </div>
            </div>

            {/* Verificación Enterprise */}
            <div className="border border-border rounded-xl p-6 hover:border-[var(--tp-buttons)] transition-colors">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Fingerprint className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="">Enterprise</h3>
                <p className="text-muted-foreground mt-2">Volumen y personalización</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">API dedicada</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">SLA garantizado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Integración personalizada</span>
                </li>
              </ul>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">Custom</p>
                <p className="text-sm text-muted-foreground">según volumen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de Verificación */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              ¿Cómo Funciona la Verificación?
            </h2>
            <p className="text-xl text-muted-foreground">
              Proceso simple y seguro en 3 pasos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--tp-brand)]">1</span>
              </div>
              <h3 className="mb-3">Captura de Documento</h3>
              <p className="text-muted-foreground">
                El usuario toma foto de su cédula o pasaporte. 
                Nuestro sistema extrae y valida todos los datos automáticamente.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--tp-brand)]">2</span>
              </div>
              <h3 className="mb-3">Selfie Biométrica</h3>
              <p className="text-muted-foreground">
                Verificación facial con liveness detection para confirmar que es una persona real, 
                no una foto o video.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--tp-brand)]">3</span>
              </div>
              <h3 className="mb-3">Resultado Instantáneo</h3>
              <p className="text-muted-foreground">
                Análisis con IA en tiempo real. Resultado aprobado/rechazado 
                con score de confianza y reporte detallado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios por Industria */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Casos de Uso por Industria
            </h2>
            <p className="text-xl text-muted-foreground">
              Soluciones específicas para cada sector
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Fintechs */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
              <h3 className="mb-4">💳 Fintechs y Bancos</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Onboarding digital de clientes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>KYC automatizado 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Cumplimiento regulaciones CMF</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Prevención de lavado de dinero</span>
                </li>
              </ul>
            </div>

            {/* E-commerce */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
              <h3 className="mb-4">🛒 E-commerce y Marketplaces</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Verificación de vendedores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Cuentas verificadas (badge azul)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Prevención de fraude</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Confianza del comprador +80%</span>
                </li>
              </ul>
            </div>

            {/* Inmobiliarias */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl">
              <h3 className="mb-4">🏠 Inmobiliarias</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Verificación de inquilinos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Validación de compradores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Contratos de arriendo seguros</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Due diligence automatizada</span>
                </li>
              </ul>
            </div>

            {/* SaaS y Apps */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl">
              <h3 className="mb-4">💻 SaaS y Apps</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Cuentas premium verificadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Reducir spam y bots</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Trust score de usuarios</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Compliance GDPR/CCPA</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Casos de Éxito Reales
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                &quot;La verificación de identidad de TuPatrimonio nos ayudó a cumplir con regulaciones KYC 
                de manera eficiente. Nuestros clientes quedan impresionados con la facilidad del proceso.&quot;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  C
                </div>
                <div>
                  <div className="font-medium text-foreground">Carlos Mendoza</div>
                  <div className="text-sm text-muted-foreground">Socio, Consultora Legal</div>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                &quot;Reducimos el tiempo de verificación de nuevos usuarios de 24 horas a 3 minutos. 
                El onboarding ahora es completamente digital y nuestros usuarios están felices.&quot;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  L
                </div>
                <div>
                  <div className="font-medium text-foreground">Laura Sánchez</div>
                  <div className="text-sm text-muted-foreground">CTO, FinTech Pro</div>
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
            <h2 className="mb-4">
              Preguntas Frecuentes
            </h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="mb-2">
                ¿Qué documentos puedo verificar?
              </h3>
              <p className="text-muted-foreground">
                Verificamos cédulas de identidad chilenas, pasaportes, licencias de conducir y 
                otros documentos oficiales. Nuestro sistema está entrenado específicamente 
                para documentos de América Latina.
              </p>
            </div>
            
            <div>
              <h3 className="mb-2">
                ¿Qué tan segura es la verificación biométrica?
              </h3>
              <p className="text-muted-foreground">
                Utilizamos algoritmos de machine learning de última generación con liveness detection 
                para prevenir suplantación. La precisión es del 99.2% y cumple con estándares 
                internacionales ISO 30107-3.
              </p>
            </div>
            
            <div>
              <h3 className="mb-2">
                ¿Cumplen con las regulaciones chilenas?
              </h3>
              <p className="text-muted-foreground">
                Sí, cumplimos completamente con la Ley 19.628 de Protección de Datos, 
                regulaciones de la CMF para instituciones financieras, y estándares 
                internacionales de privacidad y seguridad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-white mb-4">
            Reduce Fraude, Acelera Onboarding
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a más de 50 fintechs que ya confían en nuestra tecnología
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-card text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
            >
              Comenzar Verificaciones Gratis
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-white border-white hover:bg-white/10 px-8 py-4"
            >
              Hablar con Especialista
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
