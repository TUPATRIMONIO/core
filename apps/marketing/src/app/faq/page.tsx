import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes - TuPatrimonio | FAQ',
  description: 'Respuestas a las preguntas más comunes sobre nuestros servicios legales digitales.',
};

export default function FAQPage() {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: '¿Qué es TuPatrimonio?',
          a: 'TuPatrimonio es una plataforma legal tech que digitaliza servicios legales como firma electrónica, verificación de identidad y notaría digital en Latinoamérica.',
        },
        {
          q: '¿En qué países opera TuPatrimonio?',
          a: 'Actualmente operamos en Chile, México y Colombia, con planes de expansión a Perú y Argentina.',
        },
      ],
    },
    {
      category: 'Firma Electrónica',
      questions: [
        {
          q: '¿La firma electrónica tiene validez legal?',
          a: 'Sí, nuestra firma electrónica tiene plena validez legal y cumple con las normativas de cada país (Ley 19.799 en Chile, NOM-151 en México, Ley 527 en Colombia).',
        },
        {
          q: '¿Cuál es la diferencia entre firma simple y avanzada?',
          a: 'La firma simple es para documentos internos y contratos básicos. La firma avanzada incluye certificación notarial y es válida para documentos oficiales y tribunales.',
        },
      ],
    },
    {
      category: 'Precios y Planes',
      questions: [
        {
          q: '¿Tienen plan gratuito?',
          a: 'Sí, nuestro plan Básico es gratuito e incluye 5 firmas al mes y almacenamiento de 1 GB.',
        },
        {
          q: '¿Puedo cancelar en cualquier momento?',
          a: 'Sí, no hay permanencia. Puedes cancelar tu plan en cualquier momento desde tu panel de usuario.',
        },
      ],
    },
    {
      category: 'Seguridad',
      questions: [
        {
          q: '¿Cómo protegen mis documentos?',
          a: 'Usamos encriptación de extremo a extremo de nivel bancario. Tus documentos están protegidos con los más altos estándares de seguridad.',
        },
        {
          q: '¿Mis datos personales están seguros?',
          a: 'Sí, cumplimos con todas las regulaciones de protección de datos personales. Nunca compartimos tu información con terceros sin tu consentimiento.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background py-20">
      <div className="max-w-4xl tp-container">
        <div className="text-center mb-16">
          <HelpCircle className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Preguntas <span className="text-[var(--tp-brand)]">Frecuentes</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Encuentra respuestas rápidas a tus dudas
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-2xl font-bold text-foreground mb-6">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIndex) => (
                  <Card key={qIndex} className="border hover:border-[var(--tp-brand)] transition-all">
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
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                ¿No encuentras lo que buscas?
              </h3>
              <p className="text-muted-foreground mb-6">
                Nuestro equipo está disponible para ayudarte
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

