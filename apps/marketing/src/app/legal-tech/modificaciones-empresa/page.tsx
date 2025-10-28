import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
import { Building2, Users, DollarSign, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Modificaciones Empresariales - TuPatrimonio | Cambios Societarios Online',
  description: 'Modifica tu empresa de forma simple: razón social, directorio, capital social, domicilio. Todo online y con validez legal.',
  keywords: ['modificación empresa', 'cambio razón social', 'aumento capital', 'directorio'],
};

export default function ModificacionesEmpresaPage() {
  return (
    <VerticalLayout
      title="Modificaciones Empresariales"
      description="Modifica tu empresa de forma rápida y segura. Todos los cambios societarios que necesitas, 100% online."
      icon={<Building2 className="w-full h-full" />}
      color="var(--tp-buttons-hover)"
      breadcrumb={[
        { label: 'Legal Tech', href: '/legal-tech' },
        { label: 'Modificaciones Empresa', href: '/legal-tech/modificaciones-empresa' },
      ]}
      showCTA={true}
      ctaText="Modificar mi Empresa"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <VerticalCard
          title="Cambio de Razón Social"
          description="Modifica el nombre de tu empresa de forma simple y rápida."
          icon={<Building2 className="w-full h-full" />}
          color="var(--tp-brand)"
          features={[
            'Inscripción incluida',
            'Publicación legal',
            'Asesoría completa',
          ]}
          href="/empezar"
          buttonText="Cambiar Nombre"
        />

        <VerticalCard
          title="Modificación Directorio"
          description="Agrega o remueve directores, gerentes y administradores."
          icon={<Users className="w-full h-full" />}
          color="var(--tp-brand)"
          features={[
            'Acta de directorio',
            'Inscripción registros',
            'Notificaciones automáticas',
          ]}
          href="/empezar"
          buttonText="Modificar Directorio"
        />

        <VerticalCard
          title="Aumento de Capital"
          description="Aumenta el capital social de tu empresa con documentación completa."
          icon={<DollarSign className="w-full h-full" />}
          color="var(--tp-brand)"
          features={[
            'Escritura pública',
            'Modificación estatutos',
            'Inscripción registral',
          ]}
          href="/empezar"
          buttonText="Aumentar Capital"
        />

        <VerticalCard
          title="Cambio de Domicilio"
          description="Cambia la dirección legal de tu empresa sin complicaciones."
          icon={<MapPin className="w-full h-full" />}
          color="var(--tp-brand)"
          features={[
            'Acta y escritura',
            'Actualización SII',
            'Certificados incluidos',
          ]}
          href="/empezar"
          buttonText="Cambiar Domicilio"
        />
      </div>
    </VerticalLayout>
  );
}

