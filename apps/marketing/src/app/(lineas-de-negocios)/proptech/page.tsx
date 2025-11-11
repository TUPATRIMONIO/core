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
      description="Comprar, vender o arrendar no tiene que ser un dolor de cabeza. Te acompañamos en todo el proceso, sin trámites eternos ni sorpresas."
      icon={<Home className="w-full h-full" />}
      color="#10b981"
      breadcrumb={[{ label: 'PropTech', href: '/proptech' }]}
    >
      <div className="grid md:grid-cols-3 gap-8">
        <VerticalCard
          title="Compraventa Digital"
          description="¿Comprar o vender una propiedad te estresa? Te guiamos paso a paso, desde la promesa hasta la escritura, todo digital y seguro."
          icon={<Home className="w-full h-full" />}
          color="#10b981"
          features={[
            'Promesa firmada desde tu casa',
            'Sin ir a la notaría una y otra vez',
            'Todos tus documentos ordenados',
            'Sabes exactamente en qué va todo',
          ]}
          href="/proptech/compraventa"
          badge="Próximamente"
        />

        <VerticalCard
          title="Gestión de Arriendos"
          description="¿Tienes propiedades en arriendo y se te complica organizarte? Aquí administras todo desde un solo lugar."
          icon={<KeyRound className="w-full h-full" />}
          color="#10b981"
          features={[
            'Contratos listos en minutos',
            'Olvídate de perseguir pagos',
            'Reporta y resuelve problemas fácilmente',
            'Comunícate sin complicaciones',
          ]}
          href="/proptech/gestion-arriendos"
          badge="Próximamente"
        />

        <VerticalCard
          title="Marketplace Inmobiliario"
          description="Conecta con personas reales que buscan exactamente lo que tú ofreces. Sin intermediarios innecesarios."
          icon={<Store className="w-full h-full" />}
          color="#10b981"
          features={[
            'Publica tu propiedad en segundos',
            'Encuentra justo lo que buscas',
            'Habla directo con tu futuro cliente',
            'Promociona como los profesionales',
          ]}
          href="/proptech/marketplace-inmobiliario"
          badge="Próximamente"
        />
      </div>

      <div className="mt-16 text-center bg-background rounded-2xl p-12 border border-border">
        <TrendingUp className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-foreground mb-4">
          Estamos construyendo algo que te va a encantar
        </h3>
        <p className="text-lg text-muted-foreground mb-6">
          Conocemos perfectamente esa sensación de perderte entre papeles, notarías y trámites interminables. Por eso estamos creando herramientas que realmente te simplifican la vida. ¿Quieres ser de los primeros en usarlas?
        </p>
      </div>
    </VerticalLayout>
  );
}

