import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - TuPatrimonio',
  description: 'Términos y condiciones de uso de la plataforma TuPatrimonio.',
};

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-gray-600">Última actualización: Enero 2025</p>
        </div>

        <Card className="border-2">
          <CardContent className="prose max-w-none pt-6">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 leading-relaxed">
                Al acceder y utilizar los servicios de TuPatrimonio, usted acepta estar sujeto a estos Términos y Condiciones, 
                todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de las leyes locales aplicables.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TuPatrimonio proporciona una plataforma digital para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Firma electrónica de documentos con validez legal</li>
                <li>Verificación de identidad (KYC)</li>
                <li>Servicios de notaría digital</li>
                <li>Gestión de documentos legales</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registro y Cuenta de Usuario</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para utilizar ciertos servicios, deberá crear una cuenta proporcionando información precisa y completa. 
                Usted es responsable de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Mantener la confidencialidad de sus credenciales</li>
                <li>Todas las actividades que ocurran bajo su cuenta</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Uso Aceptable</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Usted se compromete a NO:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Utilizar el servicio para propósitos ilegales</li>
                <li>Intentar obtener acceso no autorizado</li>
                <li>Interferir con el funcionamiento del servicio</li>
                <li>Cargar contenido malicioso o dañino</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Propiedad Intelectual</h2>
              <p className="text-gray-700 leading-relaxed">
                Todos los derechos de propiedad intelectual sobre la plataforma, contenido, marcas y logotipos son propiedad 
                de TuPatrimonio o sus licenciantes. No se otorga ningún derecho sobre estos excepto los expresamente indicados.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Validez Legal de Documentos</h2>
              <p className="text-gray-700 leading-relaxed">
                Los documentos firmados a través de nuestra plataforma tienen validez legal conforme a las leyes aplicables 
                de cada jurisdicción (Ley 19.799 en Chile, NOM-151 en México, Ley 527 en Colombia, etc.).
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 leading-relaxed">
                TuPatrimonio no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten 
                del uso o la imposibilidad de uso del servicio.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modificaciones</h2>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor 
                inmediatamente después de su publicación en la plataforma.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Ley Aplicable</h2>
              <p className="text-gray-700 leading-relaxed">
                Estos términos se regirán por las leyes del país donde se preste el servicio específico.
              </p>
            </section>

            <Separator className="my-8" />

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Para consultas sobre estos términos, contáctenos en: <strong>legal@tupatrimonio.app</strong>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

