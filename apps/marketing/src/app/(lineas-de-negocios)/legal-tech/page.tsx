import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
import { 
  FileSignature, 
  FileCheck, 
  Building2,
  Scale
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Legal Tech - TuPatrimonio | Tecnología para Servicios Legales',
  description: 'Soluciones Legal Tech: firma electrónica, trámites notariales y modificaciones empresariales. Simplifica tus procesos legales con tecnología.',
  keywords: ['legal tech', 'firma electrónica', 'notaría digital', 'legaltech', 'tecnología legal'],
};

export default function LegalTechPage() {
  return (
    <VerticalLayout
      title="Legal Tech"
      description="Los trámites legales no tienen que ser un martirio. Firma, notariza y modifica documentos desde donde estés, con la misma validez legal que siempre."
      icon={<Scale className="w-full h-full" />}
      color="#800039"
      breadcrumb={[
        { label: 'Legal Tech', href: '/legal-tech' },
      ]}
      showCTA={true}
      ctaText="Explorar Servicios Legales"
      ctaHref="/empezar"
    >
      {/* Servicios principales */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <VerticalCard
          title="Firma Electrónica"
          description="¿Te estresa coordinar firmas? Ahora puedes firmar desde tu celular, con el mismo respaldo legal que si estuvieras en la notaría."
          icon={<FileSignature className="w-full h-full" />}
          color="#800039"
          features={[
            'Simple y rápida, o avanzada si lo necesitas',
            'Vale igual que tu firma en papel',
            'Conéctala a tus sistemas si quieres',
            'Firma todo lo que necesites',
            'Sabes quién firmó y cuándo',
          ]}
          href="/legal-tech/firma-electronica"
          buttonText="Ver Firma Electrónica"
          variant="featured"
        />

        <VerticalCard
          title="Trámites Notariales"
          description="¿Odias las filas en la notaría? Nosotros también. Por eso creamos una forma de hacer tus trámites sin salir de casa."
          icon={<FileCheck className="w-full h-full" />}
          color="#404040"
          features={[
            'Notariza sin moverte de tu casa',
            'Copias con el mismo valor legal',
            'Protocoliza documentos online',
            'Los tribunales las aceptan sin problema',
            'Tu tiempo vale oro',
          ]}
          href="/legal-tech/tramites-notariales"
          buttonText="Ver Trámites Notariales"
        />

        <VerticalCard
          title="Modificaciones de Empresa"
          description="¿Tu empresa necesita cambios? Te ayudamos a hacerlo rápido y sin complicaciones legales de por medio."
          icon={<Building2 className="w-full h-full" />}
          color="#555555"
          features={[
            'Cambia el nombre de tu empresa',
            'Actualiza tu directorio fácilmente',
            'Aumenta tu capital cuando lo necesites',
            'Cambia de dirección sin drama',
            'Te guiamos en cada paso',
          ]}
          href="/legal-tech/modificaciones-empresa"
          buttonText="Ver Modificaciones"
        />
      </div>

      {/* Beneficios del vertical */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
          ¿Por qué miles de personas ya confían en nosotros?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Rapidez',
              description: 'Lo que antes te tomaba días, ahora lo resuelves en minutos',
            },
            {
              title: 'Seguridad',
              description: 'Tus documentos están tan seguros como en un banco',
            },
            {
              title: 'Validez Legal',
              description: 'Todo lo que hacemos cumple con la ley al 100%',
            },
            {
              title: 'Ahorro',
              description: 'Pagas hasta 70% menos que en los métodos tradicionales',
            },
          ].map((benefit, index) => (
            <div 
              key={index}
              className="bg-card p-6 rounded-xl border-2 border-[#80003933] hover:border-[#800039] transition-all"
            >
              <h3 className="text-xl font-bold text-[#800039] mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>
    </VerticalLayout>
  );
}

