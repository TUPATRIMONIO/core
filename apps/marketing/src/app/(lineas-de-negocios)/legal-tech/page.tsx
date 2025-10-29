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
      description="Revoluciona tus procesos legales con tecnología de vanguardia. Firma, notariza y modifica documentos empresariales de forma digital y segura."
      icon={<Scale className="w-full h-full" />}
      color="var(--tp-brand)"
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
          description="Firma documentos con validez legal total. Cumple normativas de Chile, México, Colombia y más países de Latinoamérica."
          icon={<FileSignature className="w-full h-full" />}
          color="var(--tp-brand)"
          features={[
            'Firma Simple y Avanzada',
            'Validez legal garantizada',
            'Integración con APIs',
            'Sin límite de documentos',
            'Trazabilidad completa',
          ]}
          href="/legal-tech/firma-electronica"
          buttonText="Ver Firma Electrónica"
          variant="featured"
        />

        <VerticalCard
          title="Trámites Notariales"
          description="Notariza documentos online sin ir a la notaría. Copias legalizadas, protocolizaciones y más trámites 100% digitales."
          icon={<FileCheck className="w-full h-full" />}
          color="var(--tp-buttons)"
          features={[
            'Notarización online',
            'Copias legalizadas',
            'Protocolización digital',
            'Válido en tribunales',
            'Sin filas ni esperas',
          ]}
          href="/legal-tech/tramites-notariales"
          buttonText="Ver Trámites Notariales"
        />

        <VerticalCard
          title="Modificaciones Empresa"
          description="Modifica tu empresa de forma simple: cambio de nombre, dirección, socios, capital social y más."
          icon={<Building2 className="w-full h-full" />}
          color="var(--tp-buttons-hover)"
          features={[
            'Cambio de razón social',
            'Modificación de directorio',
            'Aumento de capital',
            'Cambio de domicilio',
            'Asesoría incluida',
          ]}
          href="/legal-tech/modificaciones-empresa"
          buttonText="Ver Modificaciones"
        />
      </div>

      {/* Beneficios del vertical */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          ¿Por qué elegir nuestras soluciones Legal Tech?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Rapidez',
              description: 'Procesos que tomaban días ahora en minutos',
            },
            {
              title: 'Seguridad',
              description: 'Encriptación de nivel bancario',
            },
            {
              title: 'Validez Legal',
              description: 'Cumple todas las normativas locales',
            },
            {
              title: 'Ahorro',
              description: 'Hasta 70% menos que métodos tradicionales',
            },
          ].map((benefit, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl border-2 border-[var(--tp-brand-20)] hover:border-[var(--tp-brand)] transition-all"
            >
              <h3 className="text-xl font-bold text-[var(--tp-brand)] mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>
    </VerticalLayout>
  );
}

