import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
import { Briefcase, Calculator, Building, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Hub - TuPatrimonio | Centro de Negocios Digital',
  description: 'Hub de negocios: contabilidad digital, oficinas virtuales y guías para emprendedores. Todo lo que tu empresa necesita.',
  keywords: ['business hub', 'contabilidad', 'oficina virtual', 'emprendimiento', 'negocios'],
};

export default function BusinessHubPage() {
  return (
    <VerticalLayout
      title="Business Hub"
      description="Tu centro de operaciones empresariales. Contabilidad, oficina virtual y recursos para hacer crecer tu negocio."
      icon={<Briefcase className="w-full h-full" />}
      color="#f59e0b"
      breadcrumb={[{ label: 'Business Hub', href: '/business-hub' }]}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Contabilidad Digital"
          description="Gestiona la contabilidad de tu empresa de forma simple y automatizada."
          icon={<Calculator className="w-full h-full" />}
          color="#f59e0b"
          features={[
            'Facturación electrónica',
            'Declaraciones automáticas',
            'Reportes en tiempo real',
            'Integración bancaria',
          ]}
          href="/business-hub/contabilidad"
          badge="Próximamente"
        />

        <VerticalCard
          title="Oficinas Virtuales"
          description="Domicilio comercial, atención de llamadas y sala de reuniones cuando lo necesites."
          icon={<Building className="w-full h-full" />}
          color="#f59e0b"
          features={[
            'Dirección comercial prestigiosa',
            'Recepción de correspondencia',
            'Salas de reunión',
            'Atención telefónica',
          ]}
          href="/business-hub/oficinas-virtuales"
          badge="Próximamente"
        />

        <VerticalCard
          title="Guías del Emprendedor"
          description="Recursos, plantillas y guías para emprendedores y dueños de negocio."
          icon={<BookOpen className="w-full h-full" />}
          color="#f59e0b"
          features={[
            'Guías paso a paso',
            'Plantillas de documentos',
            'Webinars y talleres',
            'Comunidad de emprendedores',
          ]}
          href="/business-hub/guias-emprendedor"
        />
      </div>

      <div className="mt-16 text-center bg-[var(--tp-background-light)] rounded-2xl p-12">
        <Briefcase className="w-16 h-16 text-amber-600 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Business Hub en Desarrollo
        </h3>
        <p className="text-lg text-gray-600 mb-6">
          Estamos construyendo el ecosistema completo para tu negocio. Sé de los primeros en acceder.
        </p>
      </div>
    </VerticalLayout>
  );
}

