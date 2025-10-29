import type { Metadata } from 'next';
import { VerticalLayout } from '@/components/VerticalLayout';
import { VerticalCard } from '@/components/VerticalCard';
import { Home, KeyRound, Store, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PropTech - TuPatrimonio | Tecnología Inmobiliaria Digital',
  description: 'Soluciones PropTech: compraventa digital, gestión de arriendos y marketplace inmobiliario. Simplifica tu negocio inmobiliario.',
  keywords: ['proptech', 'inmobiliaria digital', 'compraventa', 'arriendos', 'real estate tech'],
};

export default function PropTechPage() {
  return (
    <VerticalLayout
      title="PropTech"
      description="Revoluciona tu negocio inmobiliario con tecnología. Digitaliza compraventas, gestiona arriendos y accede a nuestro marketplace."
      icon={<Home className="w-full h-full" />}
      color="#10b981"
      breadcrumb={[{ label: 'PropTech', href: '/proptech' }]}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Compraventa Digital"
          description="Digitaliza todo el proceso de compraventa: promesa, escritura, inscripción y más."
          icon={<Home className="w-full h-full" />}
          color="#10b981"
          features={[
            'Promesa de compraventa digital',
            'Firma electrónica incluida',
            'Gestión de documentos',
            'Seguimiento en tiempo real',
          ]}
          href="/proptech/compraventa"
          badge="Próximamente"
        />

        <VerticalCard
          title="Gestión de Arriendos"
          description="Administra tus propiedades en arriendo: contratos, pagos, mantenciones y más."
          icon={<KeyRound className="w-full h-full" />}
          color="#10b981"
          features={[
            'Contratos digitales',
            'Gestión de pagos',
            'Mantenciones y reparaciones',
            'Comunicación con arrendatarios',
          ]}
          href="/proptech/gestion-arriendos"
          badge="Próximamente"
        />

        <VerticalCard
          title="Marketplace Inmobiliario"
          description="Publica y encuentra propiedades en nuestro marketplace exclusivo."
          icon={<Store className="w-full h-full" />}
          color="#10b981"
          features={[
            'Publicación de propiedades',
            'Búsqueda avanzada',
            'Conexión directa con clientes',
            'Herramientas de marketing',
          ]}
          href="/proptech/marketplace-inmobiliario"
          badge="Próximamente"
        />
      </div>

      <div className="mt-16 text-center bg-[var(--tp-background-light)] rounded-2xl p-12">
        <TrendingUp className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Interesado en nuestras soluciones PropTech?
        </h3>
        <p className="text-lg text-gray-600 mb-6">
          Estamos desarrollando estas funcionalidades. Regístrate para recibir acceso anticipado.
        </p>
      </div>
    </VerticalLayout>
  );
}

