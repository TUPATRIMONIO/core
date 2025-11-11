import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Briefcase, BookOpen, GraduationCap, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Hub - TuPatrimonio | Centro de Negocios Digital',
  description: 'Hub de negocios: guías para emprendedores, formaciones y herramientas digitales. Todo lo que tu empresa necesita para crecer.',
  keywords: ['business hub', 'guías emprendedor', 'formaciones', 'herramientas negocios', 'emprendimiento'],
};

export default function BusinessHubPage() {
  return (
    <VerticalLayout
      title="Business Hub"
      description="Todo lo que tu negocio necesita en un solo lugar. Olvídate del papeleo y enfócate en hacer crecer tu empresa."
      icon={<Briefcase className="w-full h-full" />}
      color="#f59e0b"
      breadcrumb={[{ label: 'Business Hub', href: '/business-hub' }]}
      showCTA={false}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Guías para Emprendedores"
          description="Sabemos que emprender puede ser abrumador. Aquí encontrarás todo lo que necesitas para avanzar con confianza."
          icon={BookOpen}
          color="#f59e0b"
          features={[
            'Paso a paso, sin complicaciones',
            'Plantillas listas para usar',
            'Consejos prácticos que funcionan',
            'Conéctate con otros emprendedores',
          ]}
          href="/business-hub/guias-emprendedor"
          buttonText="Próximamente"
          badge="Próximamente"
        />

        <VerticalCard
          title="Formaciones"
          description="Aprende lo que realmente necesitas para hacer crecer tu negocio. Cursos creados por personas que han estado en tu lugar."
          icon={GraduationCap}
          color="#f59e0b"
          features={[
            'Cursos cortos y al grano',
            'Desde lo básico hasta lo avanzado',
            'Aprende a tu ritmo',
            'Certificados que valen',
          ]}
          href="/business-hub/formaciones"
          buttonText="Próximamente"
          badge="Próximamente"
        />

        <VerticalCard
          title="Herramientas"
          description="Las herramientas digitales que todo emprendedor necesita, sin complicaciones técnicas ni curvas de aprendizaje eternas."
          icon={Wrench}
          color="#f59e0b"
          features={[
            'Calculadoras para tu negocio',
            'Generadores de documentos',
            'Plantillas pre-diseñadas',
            'Todo gratis y fácil de usar',
          ]}
          href="/business-hub/herramientas"
          buttonText="Próximamente"
          badge="Próximamente"
        />
      </div>

      <div className="mt-16 text-center bg-background rounded-2xl p-12 border border-border">
        <Briefcase className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-foreground mb-4">
          Lo estamos preparando con mucho cariño
        </h3>
        <p className="text-lg text-muted-foreground mb-8">
          Queremos que tu negocio tenga todas las herramientas que merece. Estamos trabajando duro para traerte estas soluciones pronto. ¿Te gustaría ser de los primeros en probarlas?
        </p>
        
        <WaitlistForm 
          source="business-hub" 
          useCase="business"
        />
      </div>
    </VerticalLayout>
  );
}

