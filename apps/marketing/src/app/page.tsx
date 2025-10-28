import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  FileSignature, 
  Shield, 
  Clock, 
  CheckCircle, 
  Users, 
  TrendingUp,
  FileCheck,
  Lock,
  Zap,
  Globe
} from "lucide-react";
import Link from "next/link";
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from "@/components/StructuredData";
import { CountrySelector } from "@tupatrimonio/location";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white">
        {/* Structured Data para SEO */}
        <StructuredData data={generateOrganizationSchema()} />
        <StructuredData data={generateWebSiteSchema()} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradiente decorativo de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tp-brand-5)] via-transparent to-[var(--tp-buttons-5)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          {/* Selector de País en la esquina superior derecha del hero */}
          <div className="absolute top-8 right-8 hidden md:block">
            <CountrySelector variant="minimal" />
          </div>

          <div className="text-center max-w-4xl mx-auto">
            {/* Badge informativo */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-[var(--tp-brand-20)] mb-6">
              <div className="w-2 h-2 bg-[var(--tp-brand)] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[var(--tp-brand)]">
                Plataforma Legal Digital para Latinoamérica
              </span>
            </div>

            {/* Headline Principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Hazlo fácil, rápido y{" "}
              <span className="text-[var(--tp-brand)] relative inline-block">
                Confiable
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 5 150 5 198 10" stroke="var(--tp-brand)" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Simplifica tus trámites legales con tecnología de vanguardia. 
              Firmas electrónicas, verificación de identidad y notaría digital en una sola plataforma.
            </p>

            {/* CTAs Principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/cl">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Comenzar Gratis
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-[var(--tp-buttons)] text-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-5)] px-8 py-6 text-lg"
              >
                Ver Cómo Funciona
              </Button>
            </div>

            {/* Selector de País para móvil */}
            <div className="md:hidden flex justify-center mb-6">
              <CountrySelector variant="button" showLabel={true} />
            </div>

            {/* Indicadores de confianza */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[var(--tp-success)]" />
                <span>Validez Legal Garantizada</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[var(--tp-success)]" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--tp-success)]" />
                <span>Disponible en Chile 🇨🇱 · Pronto en más países</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Separador visual */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Separator className="my-8" />
      </div>

      {/* Sección de Servicios Principales */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Servicios que Transforman tu Gestión Legal
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Herramientas potentes y cómodas para agilizar tus procesos legales desde cualquier lugar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Firma Electrónica */}
            <Card className="border-2 border-transparent hover:border-[var(--tp-brand)] transition-all duration-300 hover:shadow-xl group">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSignature className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Firma Electrónica</CardTitle>
                <CardDescription className="text-base">
                  Firma documentos de forma segura con validez legal completa. 
                  Reduce tiempos de gestión en un 90%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Firma Simple y Avanzada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Certificada por Notarios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Sin descargas ni instalaciones</span>
                  </li>
                </ul>
                <Link href="/cl/firmas-electronicas">
                  <Button variant="outline" className="w-full group-hover:bg-[var(--tp-brand)] group-hover:text-white group-hover:border-[var(--tp-brand)] transition-all">
                    Conocer Más
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Verificación de Identidad */}
            <Card className="border-2 border-transparent hover:border-[var(--tp-buttons)] transition-all duration-300 hover:shadow-xl group">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--tp-buttons)] to-[var(--tp-buttons-hover)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Verificación de Identidad</CardTitle>
                <CardDescription className="text-base">
                  Verifica usuarios con biometría facial y documentos oficiales en menos de 3 minutos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Biometría facial avanzada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Validación de documentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Cumplimiento normativo</span>
                  </li>
                </ul>
                <Link href="/cl/verificacion-identidad">
                  <Button variant="outline" className="w-full group-hover:bg-[var(--tp-buttons)] group-hover:text-white group-hover:border-[var(--tp-buttons)] transition-all">
                    Conocer Más
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Notaría Digital */}
            <Card className="border-2 border-transparent hover:border-[var(--tp-brand-light)] transition-all duration-300 hover:shadow-xl group">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--tp-brand-light)] to-[var(--tp-brand)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileCheck className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Notaría Digital</CardTitle>
                <CardDescription className="text-base">
                  Notariza documentos online con validez legal. Sin filas ni trámites presenciales.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Copias legalizadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Protocolización notarial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">100% remoto</span>
                  </li>
                </ul>
                <Link href="/cl/notaria-digital">
                  <Button variant="outline" className="w-full group-hover:bg-[var(--tp-brand-light)] group-hover:text-white group-hover:border-[var(--tp-brand-light)] transition-all">
                    Conocer Más
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección de Beneficios / Stats */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-buttons)] to-[var(--tp-buttons-hover)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Números que Hablan por Nosotros
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Miles de empresas y profesionales confían en TuPatrimonio para sus trámites legales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-3">+500</div>
              <div className="text-xl text-white/90">Empresas Activas</div>
              <p className="text-white/70 mt-2">
                Desde startups hasta corporaciones
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileCheck className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-3">+10K</div>
              <div className="text-xl text-white/90">Documentos Firmados</div>
              <p className="text-white/70 mt-2">
                Con validez legal garantizada
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-3">90%</div>
              <div className="text-xl text-white/90">Reducción de Tiempos</div>
              <p className="text-white/70 mt-2">
                En comparación con trámites tradicionales
              </p>
            </div>
          </div>

          {/* Logos de clientes placeholder */}
          <div className="mt-20 pt-12 border-t border-white/20">
            <p className="text-center text-white/70 mb-8">Confían en TuPatrimonio</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-70">
              {["StartupTech", "Legal Corp", "Inmobiliaria Sur", "FinTech Pro"].map((company) => (
                <div key={company} className="h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center px-6">
                  <span className="text-white font-medium">{company}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Suscripción / Newsletter */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-[var(--tp-brand-20)] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-[var(--tp-brand-5)] to-transparent p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--tp-brand)] rounded-full mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Suscríbete a TuPatrimonio News 📬
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                  Recibe contenido exclusivo sobre transformación digital legal
                </p>
                <p className="text-2xl font-bold text-[var(--tp-brand)]">
                  ¡Y gana un 15% de descuento en tu primer servicio! 🎉
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-base font-medium mb-2 block">
                      Correo electrónico
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tu@email.com"
                      className="h-12 text-base border-2 focus:border-[var(--tp-brand)]"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white h-12 text-base shadow-lg"
                  >
                    Suscribirme Ahora
                  </Button>
                </div>

                <p className="text-sm text-gray-500 text-center mt-4">
                  Al suscribirte aceptas recibir emails con novedades, tips y ofertas especiales.
                  Puedes cancelar en cualquier momento.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer Corporativo */}
      <footer className="bg-[var(--tp-background-dark)] text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Columna 1: Marca */}
            <div>
              <h3 className="text-2xl font-bold mb-4">TuPatrimonio®</h3>
              <p className="text-white/80 mb-4">
                Transformando la gestión legal con tecnología de vanguardia
              </p>
              <div className="space-y-2 text-sm text-white/70">
                <p>🇨🇱 Tu Patrimonio SpA (Chile)</p>
                <p>🇺🇸 Tu Patrimonio LLC (USA)</p>
              </div>
            </div>

            {/* Columna 2: Enlaces */}
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-white/80">
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog y Guías
                  </Link>
                </li>
                <li>
                  <Link href="/preguntas-frecuentes" className="hover:text-white transition-colors">
                    Preguntas Frecuentes
                  </Link>
                </li>
                <li>
                  <Link href="/soporte" className="hover:text-white transition-colors">
                    Soporte
                  </Link>
                </li>
                <li>
                  <Link href="/alianzas" className="hover:text-white transition-colors">
                    Programa de Alianzas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/80">
                <li>
                  <Link href="/terminos" className="hover:text-white transition-colors">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-white transition-colors">
                    Política de Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="bg-white/20 my-8" />

          <div className="text-center text-white/60 text-sm">
            <p>Copyright © 2025 TuPatrimonio. Todos los derechos reservados.</p>
            <p className="mt-2">
              Plataforma de servicios legales digitales. Operativo en Chile 🇨🇱 · Próximamente en más países de Latinoamérica
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
