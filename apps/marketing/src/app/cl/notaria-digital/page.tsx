import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, DollarSign, Users, Star, Building, FileText, Stamp } from "lucide-react";

export const metadata: Metadata = {
  title: "Notaría Digital Chile - Notarización Online Válida | TuPatrimonio",
  description: "Notariza documentos online con validez legal completa en Chile. Sin filas, sin citas. Ahorra 80% del tiempo y 60% del costo vs notaría tradicional.",
  keywords: ["notaría digital chile", "notarizar documentos online", "notaría virtual", "documentos notariales digitales", "notaría digital válida"],
  openGraph: {
    title: "Notaría Digital Chile - Notarización Online Válida | TuPatrimonio",
    description: "Notariza documentos online con validez legal. Sin filas, sin citas. Ahorra 80% del tiempo y 60% del costo.",
    url: "https://tupatrimonio.app/notaria-digital",
    images: [
      {
        url: "/notaria-digital-og.jpg",
        width: 1200,
        height: 630,
        alt: "Notaría Digital Chile - TuPatrimonio"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notaría Digital Chile - Notarización Online",
    description: "Notariza documentos online con validez legal. Sin filas, ahorra 80% del tiempo.",
    images: ["/notaria-digital-og.jpg"],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/notaria-digital",
  },
};

export default function NotariaDigitalPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="text-[var(--tp-buttons)]">Notaría Digital</span><br />
                Sin Filas, Sin Esperas
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Notariza documentos online con <strong>validez legal completa</strong>. 
                Ahorra <strong>80% del tiempo</strong> y <strong>60% del costo</strong> vs notaría tradicional.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-4"
                >
                  Notarizar Ahora Gratis
                </Button>
                <Button variant="outline" size="lg">
                  Ver Cómo Funciona
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>15 min promedio</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>60% más barato</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>100% legal</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Placeholder para imagen/video */}
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-8 text-center">
                <Stamp className="w-16 h-16 text-[var(--tp-buttons)] mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Proceso 100% Digital</p>
                <p className="text-sm text-gray-600">Validez legal garantizada</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa: Tradicional vs Digital */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Notaría Digital vs Tradicional
            </h2>
            <p className="text-xl text-gray-600">
              Compara la diferencia y decide tu mismo
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Notaría Tradicional */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <div className="text-center mb-6">
                <Building className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">Notaría Tradicional</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✗</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Tiempo:</span>
                    <p className="text-gray-600 text-sm">2-5 horas (viaje + espera + trámite)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✗</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Costo:</span>
                    <p className="text-gray-600 text-sm">$15,000 - $35,000 CLP</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✗</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Horarios:</span>
                    <p className="text-gray-600 text-sm">9:00 - 17:00 hrs, solo días hábiles</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✗</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Ubicación:</span>
                    <p className="text-gray-600 text-sm">Presencial obligatorio, viajes</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Notaría Digital */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
              <div className="text-center mb-6">
                <Stamp className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">Notaría Digital TuPatrimonio</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Tiempo:</span>
                    <p className="text-gray-600 text-sm">15 minutos promedio, 100% online</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Costo:</span>
                    <p className="text-gray-600 text-sm">$6,000 - $12,000 CLP (60% menos)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Horarios:</span>
                    <p className="text-gray-600 text-sm">24/7 disponible, fines de semana incluidos</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Ubicación:</span>
                    <p className="text-gray-600 text-sm">Desde cualquier lugar del mundo</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Documentos que Puedes Notarizar */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Documentos que Puedes Notarizar Online
            </h2>
            <p className="text-xl text-gray-600">
              Amplia variedad de documentos con validez legal completa
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "Contratos Comerciales", desc: "Compraventa, servicios, distribución" },
              { icon: Building, title: "Documentos Inmobiliarios", desc: "Arriendos, promesas, mandatos" },
              { icon: Users, title: "Poderes y Mandatos", desc: "Representación legal y comercial" },
              { icon: Shield, title: "Acuerdos de Confidencialidad", desc: "NDAs, acuerdos de no competencia" },
              { icon: FileText, title: "Actas y Certificados", desc: "Reuniones, constituciones, actas" },
              { icon: DollarSign, title: "Documentos Financieros", desc: "Pagarés, garantías, avales" }
            ].map((documento, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border hover:border-[var(--tp-buttons)] transition-colors">
                <documento.icon className="w-8 h-8 text-[var(--tp-buttons)] mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">{documento.title}</h4>
                <p className="text-gray-600 text-sm">{documento.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">¿No encuentras tu tipo de documento?</p>
            <Button variant="outline">Consultar Disponibilidad</Button>
          </div>
        </div>
      </section>

      {/* Proceso de Notarización */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cómo Funciona la Notarización Digital
            </h2>
            <p className="text-xl text-gray-600">
              Proceso simple, seguro y 100% legal en 4 pasos
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--tp-buttons)]">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sube Documento</h3>
              <p className="text-gray-600">
                Carga tu documento en PDF o toma foto. 
                El sistema verifica formato y contenido automáticamente.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--tp-buttons)]">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verifica Identidad</h3>
              <p className="text-gray-600">
                Verificación biométrica de todas las partes involucradas 
                para garantizar autenticidad.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--tp-buttons)]">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Certificación Digital</h3>
              <p className="text-gray-600">
                Timestamp notarial, hash criptográfico y certificado de autenticidad 
                con firma digital del notario.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--tp-buttons)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[var(--tp-buttons)]">4</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Documento Listo</h3>
              <p className="text-gray-600">
                Recibe documento notarizado con certificado de autenticidad. 
                Validez legal completa e inmediata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Clave */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué Elegir Notaría Digital?
            </h2>
            <p className="text-xl text-gray-600">
              Ventajas que transformarán tu forma de notarizar
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <Clock className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ahorro de Tiempo</h3>
              <p className="text-gray-600">
                De 3+ horas a 15 minutos. Sin viajes, sin esperas, sin citas.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <DollarSign className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Menor Costo</h3>
              <p className="text-gray-600">
                60% más barato que notaría tradicional. Sin costos ocultos.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <Shield className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mayor Seguridad</h3>
              <p className="text-gray-600">
                Verificación biométrica y trazabilidad blockchain.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <Zap className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Disponibilidad 24/7</h3>
              <p className="text-gray-600">
                Notariza cuando quieras, desde donde quieras.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <FileText className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Copia Digital</h3>
              <p className="text-gray-600">
                Acceso inmediato a tu documento desde cualquier dispositivo.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <CheckCircle className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Misma Validez Legal</h3>
              <p className="text-gray-600">
                100% válido legalmente, reconocido por tribunales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Lo que Dicen Nuestros Clientes
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(4)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
                <Star className="w-5 h-5 text-gray-300" />
              </div>
              <blockquote className="text-gray-700 mb-4">
                &quot;Hemos notarizado más de 200 contratos de arriendo a través de la plataforma. 
                La validez legal está garantizada y nuestros clientes ahorran tiempo y dinero.&quot;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <div className="font-medium text-gray-900">Ana Ruiz</div>
                  <div className="text-sm text-gray-600">Gerente, Inmobiliaria del Sur</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-4">
                &quot;Como abogado, necesitaba una solución confiable para notarización remota. 
                TuPatrimonio superó mis expectativas en validez legal y facilidad de uso.&quot;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  R
                </div>
                <div>
                  <div className="font-medium text-gray-900">Roberto Silva</div>
                  <div className="text-sm text-gray-600">Abogado, Silva & Asociados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Moderniza tu Gestión Notarial
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a la revolución digital de los servicios notariales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-[var(--tp-buttons)] border-white hover:bg-gray-100 px-8 py-4"
            >
              Notarizar Primer Documento Gratis
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-white border-white hover:bg-white/10 px-8 py-4"
            >
              Consultar Precios Empresariales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
