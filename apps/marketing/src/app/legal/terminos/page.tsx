import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Shield, Calendar } from "lucide-react";
import Link from "next/link";
import { LegalNavigation } from "@/components/LegalNavigation";

export const metadata: Metadata = {
  title: "Términos de Servicio - TuPatrimonio",
  description: "Términos y condiciones de uso de la plataforma TuPatrimonio. Servicios de firma electrónica, verificación de identidad y notaría digital.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TerminosPage() {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <LegalNavigation />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-12">
              <FileText className="w-12 h-12 text-[var(--tp-buttons)] mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Términos de Servicio
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Última actualización: 21 de octubre de 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Vigente desde: 21 de octubre de 2025</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              
              <h2>1. Definiciones y Alcance</h2>
              <p>
                Estos Términos de Servicio (&quot;Términos&quot;) rigen el uso de la plataforma TuPatrimonio 
                (&quot;la Plataforma&quot;, &quot;nuestros Servicios&quot;) operada por TuPatrimonio SpA (&quot;nosotros&quot;, &quot;nuestro&quot;, &quot;la Empresa&quot;).
              </p>
              
              <p>
                Al acceder o utilizar nuestros servicios, usted (&quot;el Usuario&quot;, &quot;usted&quot;) acepta 
                estar sujeto a estos Términos. Si no está de acuerdo con alguna parte de estos términos, 
                no debe usar nuestros servicios.
              </p>

              <h2>2. Descripción de los Servicios</h2>
              <p>TuPatrimonio proporciona los siguientes servicios digitales:</p>
              <ul>
                <li><strong>Firma Electrónica:</strong> Servicios de firma digital con validez legal en Chile</li>
                <li><strong>Verificación de Identidad:</strong> Verificación biométrica y de documentos para KYC</li>
                <li><strong>Notaría Digital:</strong> Servicios de notarización y certificación digital</li>
                <li><strong>Gestión Documental:</strong> Almacenamiento y gestión segura de documentos</li>
              </ul>

              <h2>3. Registro y Cuentas de Usuario</h2>
              <h3>3.1 Elegibilidad</h3>
              <p>
                Para usar nuestros servicios, debe ser mayor de 18 años y tener capacidad legal 
                para celebrar contratos vinculantes.
              </p>
              
              <h3>3.2 Tipos de Cuenta</h3>
              <ul>
                <li><strong>Personal:</strong> Para uso individual y freelancers</li>
                <li><strong>Empresarial:</strong> Para organizaciones y equipos</li>
                <li><strong>Enterprise:</strong> Para grandes corporaciones con necesidades específicas</li>
              </ul>

              <h3>3.3 Responsabilidad de la Cuenta</h3>
              <p>
                Usted es responsable de mantener la confidencialidad de sus credenciales de acceso 
                y de todas las actividades que ocurran bajo su cuenta.
              </p>

              <h2>4. Validez Legal de los Servicios</h2>
              <h3>4.1 Firma Electrónica</h3>
              <p>
                Nuestros servicios de firma electrónica cumplen con la Ley 19.799 de Chile sobre 
                Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de la Firma Electrónica.
              </p>

              <h3>4.2 Verificación de Identidad</h3>
              <p>
                Los servicios de verificación de identidad cumplen con las regulaciones chilenas 
                de protección de datos (Ley 19.628) y normativas internacionales de KYC/AML.
              </p>

              <h2>5. Privacidad y Protección de Datos</h2>
              <p>
                El tratamiento de sus datos personales se rige por nuestra Política de Privacidad, 
                que forma parte integral de estos Términos.
              </p>

              <h2>6. Facturación y Pagos</h2>
              <h3>6.1 Planes y Precios</h3>
              <p>
                Los precios están especificados en nuestra página de precios y pueden cambiar 
                con 30 días de notificación previa.
              </p>

              <h3>6.2 Facturación Automática</h3>
              <p>
                Los planes de suscripción se facturan automáticamente según el período elegido 
                (mensual o anual).
              </p>

              <h2>7. Limitaciones de Responsabilidad</h2>
              <p>
                En la medida máxima permitida por la ley, TuPatrimonio no será responsable por 
                daños indirectos, incidentales, especiales o consecuenciales.
              </p>

              <h2>8. Modificaciones</h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. 
                Las modificaciones entrarán en vigor 30 días después de su publicación.
              </p>

              <h2>9. Ley Aplicable</h2>
              <p>
                Estos Términos se rigen por las leyes de Chile. Cualquier disputa será resuelta 
                por los tribunales competentes de Santiago, Chile.
              </p>

              <h2>10. Contacto</h2>
              <p>
                Si tiene preguntas sobre estos Términos, puede contactarnos en:
              </p>
              <ul>
                <li>Email: legal@tupatrimonio.app</li>
                <li>Dirección: Santiago, Chile</li>
                <li>Teléfono: +56 9 XXXX XXXX</li>
              </ul>

            </div>

            {/* CTA */}
            <div className="mt-12 text-center pt-8 border-t">
              <p className="text-gray-600 mb-4">
                ¿Listo para comenzar con TuPatrimonio?
              </p>
              <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                Crear Cuenta Gratis
              </Button>
            </div>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
