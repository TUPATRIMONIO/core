import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Cookie, Settings, BarChart, Shield, Calendar } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Cookies - TuPatrimonio",
  description: "Política de cookies y tecnologías de seguimiento de TuPatrimonio. Cómo utilizamos cookies para mejorar tu experiencia.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-12">
              <Cookie className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Política de Cookies
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Última actualización: 21 de octubre de 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Transparencia total</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              
              <h2>1. ¿Qué son las Cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo 
                cuando visita nuestro sitio web. Nos ayudan a proporcionarle una mejor experiencia 
                y a entender cómo usa nuestros servicios.
              </p>

              <h2>2. Tipos de Cookies que Utilizamos</h2>

              <div className="grid md:grid-cols-2 gap-6 my-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <Settings className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Cookies Esenciales</h3>
                  <p className="text-gray-600 text-sm">
                    Necesarias para el funcionamiento básico del sitio. 
                    No se pueden desactivar.
                  </p>
                  <ul className="text-sm text-gray-600 mt-3 space-y-1">
                    <li>• Sesión de usuario</li>
                    <li>• Preferencias de idioma</li>
                    <li>• Configuración de seguridad</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <BarChart className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Cookies de Analytics</h3>
                  <p className="text-gray-600 text-sm">
                    Nos ayudan a entender cómo usa el sitio y mejorarlo.
                  </p>
                  <ul className="text-sm text-gray-600 mt-3 space-y-1">
                    <li>• Google Analytics</li>
                    <li>• Métricas de rendimiento</li>
                    <li>• Patrones de uso</li>
                  </ul>
                </div>
              </div>

              <h3>2.1 Cookies Esenciales</h3>
              <p>
                Estas cookies son estrictamente necesarias para proporcionar nuestros servicios:
              </p>
              <ul>
                <li><strong>Autenticación:</strong> Para mantener su sesión iniciada</li>
                <li><strong>Seguridad:</strong> Para proteger contra ataques CSRF</li>
                <li><strong>Funcionalidad:</strong> Para recordar sus preferencias</li>
              </ul>

              <h3>2.2 Cookies de Rendimiento y Analytics</h3>
              <p>
                Utilizamos cookies de analytics para:
              </p>
              <ul>
                <li>Entender cómo los usuarios navegan por nuestro sitio</li>
                <li>Identificar páginas populares y áreas de mejora</li>
                <li>Optimizar la experiencia del usuario</li>
                <li>Generar estadísticas agregadas y anónimas</li>
              </ul>

              <h3>2.3 Cookies de Marketing (Futuras)</h3>
              <p>
                Con su consentimiento, podríamos usar cookies para:
              </p>
              <ul>
                <li>Mostrar anuncios relevantes</li>
                <li>Medir la efectividad de campañas</li>
                <li>Personalizar contenido</li>
              </ul>

              <h2>3. Cookies de Terceros</h2>
              
              <h3>3.1 Google Analytics</h3>
              <p>
                Utilizamos Google Analytics para entender el comportamiento de los usuarios. 
                Google puede usar esta información según su propia política de privacidad.
              </p>

              <h3>3.2 Servicios de Verificación</h3>
              <p>
                Nuestros proveedores de verificación de identidad pueden establecer cookies 
                durante el proceso de verificación para garantizar la seguridad.
              </p>

              <h2>4. Control de Cookies</h2>

              <h3>4.1 Configuración del Navegador</h3>
              <p>
                Puede controlar y eliminar cookies a través de la configuración de su navegador. 
                Tenga en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio.
              </p>

              <h3>4.2 Opt-out de Analytics</h3>
              <p>
                Puede optar por no participar en Google Analytics visitando: 
                <a href="https://tools.google.com/dlpage/gaoptout" className="text-[var(--tp-buttons)] underline">
                  https://tools.google.com/dlpage/gaoptout
                </a>
              </p>

              <h2>5. Retención de Cookies</h2>
              <p>
                Los períodos de retención varían según el tipo de cookie:
              </p>
              <ul>
                <li><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador</li>
                <li><strong>Cookies persistentes:</strong> Permanecen hasta 2 años o hasta que las elimine</li>
                <li><strong>Cookies de analytics:</strong> 26 meses (estándar de Google Analytics)</li>
              </ul>

              <h2>6. Actualizaciones de esta Política</h2>
              <p>
                Podemos actualizar esta Política de Cookies ocasionalmente. 
                La fecha de la última actualización se muestra al inicio de esta página.
              </p>

              <h2>7. Contacto</h2>
              <p>
                Si tiene preguntas sobre nuestro uso de cookies, contáctenos:
              </p>
              <ul>
                <li><strong>Email:</strong> privacidad@tupatrimonio.app</li>
                <li><strong>Asunto:</strong> &quot;Consulta sobre Cookies&quot;</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  💡 Configurar Preferencias de Cookies
                </h3>
                <p className="text-yellow-800 mb-4">
                  Puede gestionar sus preferencias de cookies en cualquier momento.
                </p>
                <div className="flex gap-4">
                  <Button size="sm" className="bg-[var(--tp-buttons)]">
                    Aceptar Todas
                  </Button>
                  <Button size="sm" variant="outline">
                    Solo Esenciales
                  </Button>
                  <Button size="sm" variant="outline">
                    Configurar
                  </Button>
                </div>
              </div>

            </div>

            {/* CTA */}
            <div className="mt-12 text-center pt-8 border-t">
              <p className="text-gray-600 mb-4">
                ¿Listo para una experiencia digital segura?
              </p>
              <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                Crear Cuenta
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
