import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad - TuPatrimonio',
  description: 'Política de privacidad y protección de datos de TuPatrimonio.',
};

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Política de Privacidad
          </h1>
          <p className="text-gray-600">Última actualización: Enero 2025</p>
        </div>

        <Card className="border-2">
          <CardContent className="prose max-w-none pt-6">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En TuPatrimonio recopilamos la siguiente información:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Información de registro:</strong> Nombre, email, teléfono, dirección</li>
                <li><strong>Información de verificación:</strong> Documentos de identidad, biometría facial</li>
                <li><strong>Información de uso:</strong> Logs, IP, dispositivo, navegación</li>
                <li><strong>Documentos:</strong> Los documentos que cargues y firmes</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Cómo Usamos tu Información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos tu información para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Verificar tu identidad (KYC)</li>
                <li>Procesar firmas electrónicas</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Comunicarnos contigo sobre el servicio</li>
                <li>Prevenir fraude y abusos</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compartir Información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Podemos compartir tu información con:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Proveedores de servicio:</strong> Para operaciones necesarias del servicio</li>
                <li><strong>Entidades regulatorias:</strong> Cuando sea requerido por ley</li>
                <li><strong>Terceros autorizados por ti:</strong> Con tu consentimiento explícito</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>NUNCA vendemos tu información personal a terceros.</strong>
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Seguridad de Datos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Implementamos medidas de seguridad robustas:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Encriptación de extremo a extremo (AES-256)</li>
                <li>Autenticación de dos factores</li>
                <li>Servidores seguros certificados</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Cumplimiento de estándares ISO 27001</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Tus Derechos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Tienes derecho a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Acceder:</strong> Solicitar una copia de tus datos</li>
                <li><strong>Rectificar:</strong> Corregir datos inexactos</li>
                <li><strong>Eliminar:</strong> Solicitar la eliminación de tus datos</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Para ejercer estos derechos, contacta: <strong>privacy@tupatrimonio.app</strong>
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retención de Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Conservamos tus datos mientras tu cuenta esté activa o según sea necesario para cumplir con obligaciones legales. 
                Los documentos firmados se conservan según los requisitos legales de cada jurisdicción (típicamente 5-10 años).
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos cookies para mejorar tu experiencia, analizar el uso del sitio y personalizar contenido. 
                Puedes controlar las cookies desde la configuración de tu navegador.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Transferencias Internacionales</h2>
              <p className="text-gray-700 leading-relaxed">
                Tus datos pueden ser transferidos y procesados en países fuera de tu residencia. 
                Aseguramos que todas las transferencias cumplan con las leyes de protección de datos aplicables.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Menores de Edad</h2>
              <p className="text-gray-700 leading-relaxed">
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información 
                de menores de edad.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cambios a esta Política</h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos actualizar esta política periódicamente. Te notificaremos de cambios significativos por email 
                o mediante aviso prominente en nuestra plataforma.
              </p>
            </section>

            <Separator className="my-8" />

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Para consultas sobre esta política o tus datos personales:<br />
                <strong>Email:</strong> privacy@tupatrimonio.app<br />
                <strong>Oficial de Protección de Datos:</strong> dpo@tupatrimonio.app
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

