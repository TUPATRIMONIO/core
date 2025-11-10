'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Cookie, Settings, BarChart, Shield, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { LegalNavigation } from "@/components/LegalNavigation";
import { IconContainer } from "@tupatrimonio/ui";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { CookiePreferencesDialog } from "@/components/CookiePreferencesDialog";

export default function CookiesPage() {
  const { acceptAll, acceptEssential, consent } = useCookieConsent();
  const [showDialog, setShowDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleAcceptAll = () => {
    acceptAll();
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleEssentialOnly = () => {
    acceptEssential();
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleConfigure = () => {
    setShowDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowDialog(open);
    if (!open && consent) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white dark:from-background dark:via-[var(--tp-background-dark)] dark:to-background">
      {/* Header */}
      <section className="bg-card border-b">
        <div className="max-w-4xl tp-container py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-[var(--tp-bg-light-20)]">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl tp-container">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <LegalNavigation />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 bg-white dark:bg-card rounded-xl shadow-xl border-2 border-border p-12">
            <div className="text-center mb-16">
              <IconContainer 
                icon={Cookie} 
                variant="solid-brand" 
                shape="rounded" 
                size="lg" 
                className="mx-auto mb-6"
              />
              <h1 className="mb-6">
                Política de Cookies
              </h1>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
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

            <div className="prose prose-lg max-w-none dark:prose-invert">
              
              <h3>1. ¿Qué son las Cookies?</h3>
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo 
                cuando visita nuestro sitio web. Nos ayudan a proporcionarle una mejor experiencia 
                y a entender cómo usa nuestros servicios.
              </p>

              <h3>2. Tipos de Cookies que Utilizamos</h3>

              <div className="grid md:grid-cols-2 gap-6 my-8">
                <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 hover:shadow-lg transition-all">
                  <IconContainer 
                    icon={Settings} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <h3 className="text-lg font-bold text-foreground mb-2">Cookies Esenciales</h3>
                  <p className="text-muted-foreground text-sm">
                    Necesarias para el funcionamiento básico del sitio. 
                    No se pueden desactivar.
                  </p>
                  <ul className="text-sm text-muted-foreground mt-3 space-y-1">
                    <li>• Sesión de usuario</li>
                    <li>• Preferencias de idioma</li>
                    <li>• Configuración de seguridad</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 hover:shadow-lg transition-all">
                  <IconContainer 
                    icon={BarChart} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <h3 className="text-lg font-bold text-foreground mb-2">Cookies de Analytics</h3>
                  <p className="text-muted-foreground text-sm">
                    Nos ayudan a entender cómo usa el sitio y mejorarlo.
                  </p>
                  <ul className="text-sm text-muted-foreground mt-3 space-y-1">
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

              <h3>3. Cookies de Terceros</h3>
              
              <h3>3.1 Google Analytics</h3>
              <p>
                Utilizamos Google Analytics para entender el comportamiento de los usuarios. 
                Google puede usar esta información según su propia política de privacidad.
              </p>
              <p>
                Para más información sobre cómo Google Analytics utiliza cookies, consulte: 
                <a href="https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage?hl=es" target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] underline">
                  Uso de cookies en Google Analytics
                </a>
              </p>

              <h3>3.2 Servicios de Verificación</h3>
              <p>
                Nuestros proveedores de verificación de identidad pueden establecer cookies 
                durante el proceso de verificación para garantizar la seguridad.
              </p>

              <h3>4. Cómo Utilizamos las Cookies en TuPatrimonio</h3>

              <h3>4.1 Cookies de Sesión</h3>
              <p>
                TuPatrimonio usa cookies cuando ingresas al sitio, al momento de generar una sesión. 
                La cookie permite mantener el seguimiento, la navegación y la seguridad durante el 
                tiempo de uso de esta sesión.
              </p>
              <p>
                En esta cookie se incluyen algunos identificadores de sesión para asegurar que solo 
                tú puedas realizar cambios en tu cuenta. También utilizamos cookies para realizar 
                seguimiento de la actividad de tu cuenta como usuario único.
              </p>
              <p>
                Toda esta información es almacenada en forma encriptada por motivos de seguridad, 
                <strong> no almacenamos ninguna información personal tuya en la cookie</strong>.
              </p>

              <h3>4.2 Cookies Persistentes</h3>
              <p>
                Usamos cookies como ID de sesión para hacer más fácil la navegación por la plataforma. 
                La cookie de sesión expira cuando cierras el navegador.
              </p>
              <p>
                También usamos una cookie persistente que se mantiene en tu disco duro por más tiempo, 
                de esta manera TuPatrimonio puede reconocer cuando regresas a navegar al sitio.
              </p>

              <h3>4.3 Importante sobre Desactivar Cookies</h3>
              <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6 my-6">
                <p className="text-yellow-900 dark:text-yellow-100">
                  <strong>⚠️ Nota importante:</strong> Puedes remover las cookies persistentes siguiendo 
                  las instrucciones provistas por tu navegador de Internet en la sección &quot;Ayuda&quot;. 
                  Sin embargo, dado que TuPatrimonio usa las cookies para la funcionalidad de autenticación, 
                  si escoges la opción de &quot;deshabilitar las cookies&quot;, no será posible que ingreses 
                  al sitio web de TuPatrimonio.
                </p>
              </div>

              <h3>5. Control de Cookies</h3>

              <h3>5.1 Configuración del Navegador</h3>
              <p>
                Puede controlar y eliminar cookies a través de la configuración de su navegador. 
                Tenga en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio.
              </p>

              <h3>5.2 Opt-out de Analytics</h3>
              <p>
                Puede optar por no participar en Google Analytics visitando: 
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] underline">
                  https://tools.google.com/dlpage/gaoptout
                </a>
              </p>

              <h3>6. Retención de Cookies</h3>
              <p>
                Los períodos de retención varían según el tipo de cookie:
              </p>
              <ul>
                <li><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador</li>
                <li><strong>Cookies persistentes:</strong> Permanecen hasta 2 años o hasta que las elimine</li>
                <li><strong>Cookies de analytics:</strong> 26 meses (estándar de Google Analytics)</li>
              </ul>

              <h3>7. Actualizaciones de esta Política</h3>
              <p>
                Podemos actualizar esta Política de Cookies ocasionalmente. 
                La fecha de la última actualización se muestra al inicio de esta página.
              </p>

              <h3>8. Contacto</h3>
              <p>
                Si tiene preguntas sobre nuestro uso de cookies, contáctenos:
              </p>
              <ul>
                <li><strong>Email:</strong> <a href="mailto:contacto@tupatrimon.io" className="text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] underline">contacto@tupatrimon.io</a></li>
                <li><strong>WhatsApp:</strong> Disponible en la sección Contacto de nuestro sitio</li>
                <li><strong>Asunto:</strong> &quot;Consulta sobre Cookies&quot;</li>
              </ul>

              {/* Mensaje de Éxito */}
              {showSuccessMessage && (
                <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 mt-8 shadow-lg animate-in slide-in-from-top">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                        ¡Preferencias Guardadas!
                      </h3>
                      <p className="text-green-800 dark:text-green-200 text-sm">
                        Tus preferencias de cookies han sido actualizadas correctamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel de Configuración */}
              <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-8 mt-8 shadow-lg">
                <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                  💡 Configurar Preferencias de Cookies
                </h3>
                <p className="text-yellow-800 dark:text-yellow-200 mb-6">
                  Puede gestionar sus preferencias de cookies en cualquier momento.
                  {consent && (
                    <span className="block mt-2 text-sm">
                      <strong>Estado actual:</strong>{' '}
                      {consent.analytics ? 'Analytics activado' : 'Solo esenciales'}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="sm" 
                    onClick={handleAcceptAll}
                    className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar Todas
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleEssentialOnly}
                    className="hover:bg-[var(--tp-bg-light-20)]"
                  >
                    Solo Esenciales
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleConfigure}
                    className="hover:bg-[var(--tp-bg-light-20)]"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>

            </div>

            {/* CTA */}
            <div className="mt-16 text-center pt-8 border-t-2">
              <p className="text-lg text-muted-foreground mb-6">
                ¿Listo para una experiencia digital segura?
              </p>
              <Button size="lg" className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] px-8">
                Crear Cuenta
              </Button>
            </div>
          </div>
        </div>
        </div>
      </section>
      </div>

      {/* Dialog de Preferencias */}
      <CookiePreferencesDialog 
        open={showDialog} 
        onOpenChange={handleDialogClose}
      />
    </>
  );
}
