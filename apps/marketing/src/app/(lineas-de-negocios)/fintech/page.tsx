import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
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
      description="Democratizamos el acceso a servicios financieros. Educación, inversiones y crowdfunding al alcance de todos."
      icon={<Wallet className="w-full h-full" />}
      color="#3b82f6"
      breadcrumb={[{ label: 'FinTech', href: '/fintech' }]}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Educación Financiera"
          description="Aprende a manejar tus finanzas personales y empresariales con nuestros cursos y recursos."
          icon={<GraduationCap className="w-full h-full" />}
          color="#3b82f6"
          features={[
            'Cursos interactivos',
            'Calculadoras financieras',
            'Artículos y guías',
            'Asesoría personalizada',
          ]}
          href="/fintech/educacion-financiera"
          badge="Próximamente"
        />

        <VerticalCard
          title="Plataforma de Inversiones"
          description="Invierte en proyectos verificados con montos accesibles y total transparencia."
          icon={<TrendingUp className="w-full h-full" />}
          color="#3b82f6"
          features={[
            'Proyectos verificados',
            'Inversión desde $10.000',
            'Diversificación fácil',
            'Reportes detallados',
          ]}
          href="/fintech/inversiones"
          badge="Próximamente"
        />

        <VerticalCard
          title="Crowdfunding"
          description="Financia tu proyecto o invierte en startups prometedoras de Latinoamérica."
          icon={<Users2 className="w-full h-full" />}
          color="#3b82f6"
          features={[
            'Publica tu proyecto',
            'Alcanza inversionistas',
            'Proceso transparente',
            'Cumplimiento legal',
          ]}
          href="/fintech/crowdfunding"
          badge="Próximamente"
        />
      </div>

      <div className="mt-16 text-center bg-[var(--tp-background-light)] rounded-2xl p-12">
        <Wallet className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-foreground mb-4">
          FinTech próximamente
        </h3>
        <p className="text-lg text-gray-600 mb-6">
          Construyendo el futuro de las finanzas en Latinoamérica. Únete a nuestra lista de espera.
        </p>
      </div>
    </VerticalLayout>
  );
}

