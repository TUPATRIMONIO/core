import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/forms/ContactForm';
import { 
  Mail, 
  MessageCircle, 
  Phone, 
  MapPin,
  Clock,
  Globe
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto - TuPatrimonio | Habla con Nuestro Equipo',
  description: 'Contáctanos para resolver tus dudas sobre servicios legales digitales. Soporte en Chile, México, Colombia, Perú y Argentina.',
  keywords: ['contacto', 'tupatrimonio', 'soporte', 'ayuda', 'consultas'],
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl tp-container">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-[var(--tp-brand-5)] rounded-full px-4 py-2 mb-6">
              <MessageCircle className="w-4 h-4 text-[var(--tp-brand)]" />
              <span className="text-sm font-medium text-[var(--tp-brand)]">
                Estamos para Ayudarte
              </span>
            </div>

            <h1 className="mb-6">
              Hablemos de tu{' '}
              <span className="text-[var(--tp-brand)]">Proyecto</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Nuestro equipo está listo para ayudarte con cualquier consulta sobre 
              nuestros servicios legales digitales.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Formulario de Contacto */}
            <div className="lg:col-span-2">
              <Card className="border-2 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl">Envíanos un Mensaje</CardTitle>
                  <CardDescription className="text-base">
                    Completa el formulario y te responderemos en menos de 24 horas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4 md:space-y-6">
              {/* Canales de Contacto */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">Canales de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[var(--tp-brand)]" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">Email</p>
                      <a 
                        href="mailto:contacto@tupatrimonio.app" 
                        className="text-sm text-[var(--tp-brand-light)] hover:underline transition-colors font-medium"
                      >
                        contacto@tupatrimonio.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[var(--tp-brand)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground mb-2">WhatsApp</p>
                      <div className="space-y-1">
                        <a 
                          href="https://wa.me/56949166719" 
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-sm text-[var(--tp-brand-light)] hover:underline transition-colors flex items-center gap-1 font-medium"
                        >
                          🇨🇱 +56 9 4916 6719 (Chile)
                        </a>
                        <a 
                          href="https://wa.me/17164428514" 
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-sm text-[var(--tp-brand-light)] hover:underline transition-colors flex items-center gap-1 font-medium"
                        >
                          🇺🇸 +1 (716) 442-8514 (EEUU)
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--tp-brand-10)] rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[var(--tp-brand)]" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">Horario</p>
                      <p className="text-sm text-muted-foreground">Lun - Vie: 9:00 - 18:00</p>
                      <p className="text-sm text-muted-foreground">Sáb: 10:00 - 14:00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Oficinas */}
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">Nuestras Oficinas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--tp-brand)]" />
                      <p className="font-medium text-card-foreground">🇨🇱 Chile</p>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Santiago
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[var(--tp-brand)]" />
                      <p className="font-medium text-card-foreground">🇺🇸 USA</p>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Delaware
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Soporte Regional */}
              <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
                <CardHeader>
                  <CardTitle className="text-xl text-[var(--tp-brand)]">Soporte Regional</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground mb-3 font-medium">
                    Atendemos consultas para:
                  </p>
                  <div className="space-y-1 text-sm text-card-foreground">
                    <p>🇨🇱 Chile</p>
                    <p>🇲🇽 México (Próximamente)</p>
                    <p>🇨🇴 Colombia (Próximamente)</p>
                    <p>🇵🇪 Perú (Próximamente)</p>
                    <p>🇦🇷 Argentina (Próximamente)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Rápido */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="max-w-4xl tp-container">
          <div className="text-center mb-12">
            <h2 className="mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Respuestas rápidas a las consultas más comunes
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cuánto tiempo tarda en responderse una consulta?',
                a: 'Respondemos todas las consultas en menos de 24 horas hábiles.'
              },
              {
                q: '¿Puedo agendar una videollamada con un experto?',
                a: 'Sí, puedes solicitar una videollamada en el formulario y te contactaremos para coordinar.'
              },
              {
                q: '¿El soporte tiene costo?',
                a: 'El soporte básico es gratuito para todos los usuarios. Los planes premium incluyen soporte prioritario.'
              },
            ].map((faq, index) => (
              <Card 
                key={index} 
                className="border hover:border-[var(--tp-brand)] transition-colors bg-card"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

