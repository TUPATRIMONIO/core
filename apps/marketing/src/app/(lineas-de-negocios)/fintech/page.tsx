import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Wallet, TrendingUp, Users2, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FinTech - TuPatrimonio | Tecnología Financiera',
  description: 'Soluciones FinTech: educación financiera, inversiones y crowdfunding. Democratizamos el acceso a servicios financieros.',
  keywords: ['fintech', 'educación financiera', 'inversiones', 'crowdfunding', 'tecnología financiera'],
};

export default function FinTechPage() {
  return (
    <VerticalLayout
      title="FinTech"
      description="Las finanzas no tienen que ser complicadas. Te ayudamos a entenderlas, invertir inteligentemente y hacer crecer tu dinero."
      icon={<Wallet className="w-full h-full" />}
      color="#3b82f6"
      breadcrumb={[{ label: 'FinTech', href: '/fintech' }]}
      showCTA={false}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Educación Financiera"
          description="¿Sientes que las finanzas son un mundo aparte? Te enseñamos todo lo que necesitas saber, en un lenguaje que realmente entiendas."
          icon={<GraduationCap className="w-full h-full" />}
          color="#3b82f6"
          features={[
            'Aprende haciendo, no solo leyendo',
            'Calcula tu futuro financiero fácilmente',
            'Guías claras y sin letra chica',
            'Un experto que te escucha',
          ]}
          href="/fintech/educacion-financiera"
          badge="Próximamente"
        />

        <VerticalCard
          title="Plataforma de Inversiones"
          description="Invertir no es solo para ricos. Empieza con poco, elige proyectos que te gusten y haz crecer tu dinero con confianza."
          icon={<TrendingUp className="w-full h-full" />}
          color="#3b82f6"
          features={[
            'Proyectos revisados uno por uno',
            'Empieza desde $10.000',
            'No pongas todos los huevos en una canasta',
            'Ve exactamente dónde está tu dinero',
          ]}
          href="/fintech/inversiones"
          badge="Próximamente"
        />

        <VerticalCard
          title="Crowdfunding"
          description="¿Tienes una idea pero te falta el empujón? O quizás quieres apoyar proyectos increíbles. Aquí conectamos sueños con recursos."
          icon={<Users2 className="w-full h-full" />}
          color="#3b82f6"
          features={[
            'Comparte tu proyecto con el mundo',
            'Conoce inversionistas que creen en ti',
            'Todo claro, sin sorpresas',
            'Cumplimos con todas las reglas',
          ]}
          href="/fintech/crowdfunding"
          badge="Próximamente"
        />
      </div>

      <div className="mt-16 text-center bg-background rounded-2xl p-12 border border-border">
        <Wallet className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-foreground mb-4">
          Estamos trabajando en algo especial
        </h3>
        <p className="text-lg text-muted-foreground mb-8">
          Sabemos que las finanzas pueden dar miedo. Por eso estamos creando herramientas que realmente te ayuden a tomar el control de tu dinero, sin estrés y sin complicaciones. ¿Te avisamos cuando esté listo?
        </p>
        
        <WaitlistForm 
          source="fintech" 
          useCase="business"
        />
      </div>
    </VerticalLayout>
  );
}

