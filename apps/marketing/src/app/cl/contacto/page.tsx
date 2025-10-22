import type { Metadata } from "next";
import ContactForm from "@/components/forms/ContactForm";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto TuPatrimonio Chile - Habla con Nuestro Equipo",
  description: "Contáctanos para consultas sobre firma electrónica, verificación de identidad y notaría digital en Chile. Respuesta en menos de 24 horas.",
  keywords: ["contacto tupatrimonio", "soporte chile", "consultas firma electrónica", "demo personalizado"],
  alternates: {
    canonical: "https://tupatrimonio.app/cl/contacto",
  },
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Hablemos de tu Proyecto
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestro equipo está listo para ayudarte a digitalizar tus procesos legales
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Múltiples Formas de Contactarnos
                </h2>
                <p className="text-lg text-gray-600">
                  Elige la opción que más te convenga. Nuestro equipo especializado 
                  te ayudará con cualquier consulta.
                </p>
              </div>

              {/* Contact Methods */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                  <div className="w-12 h-12 bg-[var(--tp-buttons)]/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[var(--tp-buttons)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600 text-sm mb-2">Para consultas generales y soporte</p>
                    <a href="mailto:contacto@tupatrimonio.app" className="text-[var(--tp-buttons)] hover:underline">
                      contacto@tupatrimonio.app
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                  <div className="w-12 h-12 bg-[var(--tp-buttons)]/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[var(--tp-buttons)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Teléfono Chile</h3>
                    <p className="text-gray-600 text-sm mb-2">Lunes a Viernes, 9:00 - 18:00 CLT</p>
                    <a href="tel:+56900000000" className="text-[var(--tp-buttons)] hover:underline">
                      +56 9 0000 0000
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                  <div className="w-12 h-12 bg-[var(--tp-buttons)]/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[var(--tp-buttons)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Oficina Santiago</h3>
                    <p className="text-gray-600 text-sm">
                      Las Condes, Santiago<br />
                      Chile
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                  <div className="w-12 h-12 bg-[var(--tp-buttons)]/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[var(--tp-buttons)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Tiempo de Respuesta</h3>
                    <p className="text-gray-600 text-sm">
                      Email: Menos de 24 horas<br />
                      Teléfono: Inmediata en horario laboral
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <ContactForm 
                formType="general"
                title="Envíanos un Mensaje"
                description="Completa el formulario y nos pondremos en contacto contigo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--tp-buttons)]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Prefieres una Demo Personalizada?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Agenda una demostración de 30 minutos y ve TuPatrimonio en acción
          </p>
          
          <ContactForm 
            formType="demo"
            title="Solicitar Demo Personalizada"
            description="Cuéntanos tu caso específico y te mostraremos cómo TuPatrimonio puede ayudarte"
            className="bg-white"
          />
        </div>
      </section>
    </div>
  );
}
