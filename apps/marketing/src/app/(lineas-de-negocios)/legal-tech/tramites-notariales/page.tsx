import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
import { FileCheck, Stamp, FileText, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trámites Notariales Digitales - TuPatrimonio | Notaría Online',
  description: 'Notarización digital con validez legal. Copias legalizadas, protocolizaciones y más sin ir a la notaría.',
  keywords: ['notaría digital', 'notarización online', 'copias legalizadas', 'protocolización'],
};

export default function TramitesNotarialesPage() {
  return (
    <VerticalLayout
      title="Trámites Notariales Digitales"
      description="Realiza todos tus trámites notariales online con validez legal total. Sin filas, sin esperas, sin complicaciones."
      icon={<FileCheck className="w-full h-full" />}
      color="var(--tp-buttons)"
      breadcrumb={[
        { label: 'Legal Tech', href: '/legal-tech' },
        { label: 'Trámites Notariales', href: '/legal-tech/tramites-notariales' },
      ]}
      showCTA={true}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Copias Legalizadas"
          description="Legaliza copias de documentos online. Validez igual que notaría presencial."
          icon={<FileText className="w-full h-full" />}
          color="var(--tp-buttons)"
          features={[
            'Proceso 100% digital',
            'Validez legal garantizada',
            'Entrega inmediata',
          ]}
          href="https://app.tupatrimonio.app"
          buttonText="Solicitar Ahora"
        />

        <VerticalCard
          title="Protocolización"
          description="Protocoliza documentos privados para darles fe pública y fecha cierta."
          icon={<Stamp className="w-full h-full" />}
          color="var(--tp-buttons)"
          features={[
            'Fe pública notarial',
            'Fecha cierta certificada',
            'Reconocimiento oficial',
          ]}
          href="https://app.tupatrimonio.app"
          buttonText="Protocolizar Documento"
        />

        <VerticalCard
          title="Otros Trámites"
          description="Consulta por otros servicios notariales disponibles según tu país."
          icon={<Shield className="w-full h-full" />}
          color="var(--tp-buttons)"
          features={[
            'Asesoría personalizada',
            'Múltiples servicios',
            'Soporte incluido',
          ]}
          href="/contacto"
          buttonText="Consultar"
        />
      </div>
    </VerticalLayout>
  );
}

