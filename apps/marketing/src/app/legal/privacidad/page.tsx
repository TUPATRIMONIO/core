import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Lock, Eye, Database, Calendar } from "lucide-react";
import Link from "next/link";
import { LegalNavigation } from "@/components/LegalNavigation";

export const metadata: Metadata = {
  title: "Política de Privacidad - TuPatrimonio",
  description: "Política de privacidad y protección de datos de TuPatrimonio. Cómo manejamos y protegemos tu información personal y documentos.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-card border-b">
        <div className="max-w-4xl tp-container py-6">
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
        <div className="max-w-7xl tp-container">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <LegalNavigation />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-12">
              <Shield className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Política de Privacidad
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Última actualización: 21 de octubre de 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Cumple Ley 19.628</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              
              <h2>1. Introducción</h2>
              <p>
                En TuPatrimonio SpA (&quot;nosotros&quot;, &quot;nuestro&quot;, &quot;la Empresa&quot;) valoramos y respetamos 
                su privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, 
                almacenamos y protegemos su información personal cuando utiliza nuestros servicios.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Compromiso con la Privacidad
                </h3>
                <p className="text-blue-800">
                  Cumplimos estrictamente con la Ley 19.628 de Protección de Datos Personales de Chile 
                  y estándares internacionales como ISO 27001.
                </p>
              </div>

              <h2>2. Información que Recopilamos</h2>
              
              <h3>2.1 Información de Registro</h3>
              <ul>
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Información de la empresa (para cuentas empresariales)</li>
              </ul>

              <h3>2.2 Información de Verificación de Identidad</h3>
              <ul>
                <li><strong>Documentos de identidad:</strong> Cédula, pasaporte, licencia de conducir</li>
                <li><strong>Datos biométricos:</strong> Fotografías faciales para verificación biométrica</li>
                <li><strong>Información extraída:</strong> Nombre, RUT, fecha de nacimiento, dirección</li>
              </ul>

              <h3>2.3 Documentos y Contenido</h3>
              <ul>
                <li>Documentos cargados para firma, verificación o notarización</li>
                <li>Metadatos de archivos (fecha, tamaño, tipo)</li>
                <li>Registros de actividad y transacciones</li>
              </ul>

              <h3>2.4 Información Técnica</h3>
              <ul>
                <li>Dirección IP y geolocalización</li>
                <li>Información del dispositivo y navegador</li>
                <li>Logs de acceso y uso de la plataforma</li>
              </ul>

              <h2>3. Cómo Usamos su Información</h2>

              <h3>3.1 Propósitos del Tratamiento</h3>
              <ul>
                <li><strong>Prestación de servicios:</strong> Procesamiento de firmas, verificaciones y notarizaciones</li>
                <li><strong>Verificación de identidad:</strong> Cumplimiento de regulaciones KYC/AML</li>
                <li><strong>Seguridad:</strong> Prevención de fraude y actividades maliciosas</li>
                <li><strong>Comunicación:</strong> Notificaciones sobre el estado de sus documentos</li>
                <li><strong>Mejora del servicio:</strong> Análisis y optimización de la plataforma</li>
              </ul>

              <h2>4. Cómo Protegemos su Información</h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-8">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Medidas de Seguridad
                </h3>
                <ul className="text-green-800 space-y-2">
                  <li>• <strong>Encriptación end-to-end</strong> para todos los documentos</li>
                  <li>• <strong>Almacenamiento seguro</strong> con cifrado AES-256</li>
                  <li>• <strong>Acceso restringido</strong> solo a personal autorizado</li>
                  <li>• <strong>Auditorías regulares</strong> de seguridad</li>
                  <li>• <strong>Infraestructura certificada</strong> ISO 27001</li>
                </ul>
              </div>

              <h2>5. Compartir Información con Terceros</h2>
              <p>
                No vendemos, alquilamos ni compartimos su información personal con terceros, 
                excepto en las siguientes circunstancias:
              </p>
              <ul>
                <li><strong>Proveedores de servicios:</strong> Para verificación biométrica y almacenamiento seguro</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por autoridades competentes</li>
                <li><strong>Consentimiento explícito:</strong> Cuando usted nos autorice específicamente</li>
              </ul>

              <h2>6. Retención de Datos</h2>
              <p>
                Mantenemos su información personal durante el tiempo necesario para:
              </p>
              <ul>
                <li>Cumplir con los propósitos descritos en esta política</li>
                <li>Satisfacer requisitos legales y regulatorios</li>
                <li>Resolver disputas y hacer cumplir nuestros acuerdos</li>
              </ul>

              <p>
                Los documentos firmados y certificados se conservan por un mínimo de 10 años 
                según las regulaciones chilenas.
              </p>

              <h2>7. Sus Derechos</h2>
              <p>Según la Ley 19.628, usted tiene derecho a:</p>
              <ul>
                <li><strong>Acceso:</strong> Solicitar una copia de su información personal</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de su información (con limitaciones legales)</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento en ciertas circunstancias</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
              </ul>

              <p>
                Para ejercer estos derechos, contáctenos en <strong>privacidad@tupatrimonio.app</strong>
              </p>

              <h2>8. Cookies y Tecnologías Similares</h2>
              <p>
                Utilizamos cookies y tecnologías similares para mejorar la funcionalidad 
                y experiencia de usuario. Consulte nuestra Política de Cookies para más detalles.
              </p>

              <h2>9. Transferencias Internacionales</h2>
              <p>
                Su información puede ser procesada en servidores ubicados en Estados Unidos o Europa, 
                que cuentan con niveles adecuados de protección de datos.
              </p>

              <h2>10. Cambios en esta Política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. 
                Le notificaremos sobre cambios significativos por email o mediante 
                aviso prominente en nuestro sitio web.
              </p>

              <h2>11. Contacto</h2>
              <p>
                Si tiene preguntas sobre esta Política de Privacidad o el tratamiento 
                de sus datos personales, contáctenos:
              </p>
              <ul>
                <li><strong>Email:</strong> privacidad@tupatrimonio.app</li>
                <li><strong>Dirección:</strong> Santiago, Chile</li>
                <li><strong>Teléfono:</strong> +56 9 XXXX XXXX</li>
              </ul>

            </div>

            {/* CTA */}
            <div className="mt-12 text-center pt-8 border-t">
              <p className="text-muted-foreground mb-4">
                ¿Tienes preguntas sobre nuestro manejo de datos?
              </p>
              <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                Contactar Equipo de Privacidad
              </Button>
            </div>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
