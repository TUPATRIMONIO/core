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
      description="Todo lo que tu negocio necesita en un solo lugar. Olvídate del papeleo y enfócate en hacer crecer tu empresa."
      icon={<Briefcase className="w-full h-full" />}
      color="#f59e0b"
      breadcrumb={[{ label: 'Business Hub', href: '/business-hub' }]}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Contabilidad Digital"
          description="Olvídate de las planillas complicadas. Te ayudamos a llevar tu contabilidad de forma simple, como debe ser."
          icon={<Calculator className="w-full h-full" />}
          color="#f59e0b"
          features={[
            'Facturación en minutos',
            'Declaraciones sin dolor de cabeza',
            'Ve tus números al instante',
            'Conecta tu banco automáticamente',
          ]}
          href="/business-hub/contabilidad"
          badge="Próximamente"
        />

        <VerticalCard
          title="Oficinas Virtuales"
          description="¿Trabajas desde casa pero necesitas una dirección profesional? Te damos presencia sin pagar arriendo."
          icon={<Building className="w-full h-full" />}
          color="#f59e0b"
          features={[
            'Dirección comercial en zona premium',
            'Recibimos tu correo por ti',
            'Salas de reunión cuando las necesites',
            'Alguien contesta tus llamadas',
          ]}
          href="/business-hub/oficinas-virtuales"
          badge="Próximamente"
        />

        <VerticalCard
          title="Guías para Emprendedores"
          description="Sabemos que emprender puede ser abrumador. Aquí encontrarás todo lo que necesitas para avanzar con confianza."
          icon={<BookOpen className="w-full h-full" />}
          color="#f59e0b"
          features={[
            'Paso a paso, sin complicaciones',
            'Plantillas listas para usar',
            'Aprende con expertos en vivo',
            'Conéctate con otros emprendedores',
          ]}
          href="/business-hub/guias-emprendedor"
        />
      </div>

      <div className="mt-16 text-center bg-background rounded-2xl p-12 border border-border">
        <Briefcase className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-foreground mb-4">
          Lo estamos preparando con mucho cariño
        </h3>
        <p className="text-lg text-muted-foreground mb-6">
          Queremos que tu negocio tenga todas las herramientas que merece. Estamos trabajando duro para traerte estas soluciones pronto. ¿Te gustaría ser de los primeros en probarlas?
        </p>
      </div>
    </VerticalLayout>
  );
}

