import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon, IconContainer } from '@tupatrimonio/ui';
import { ArrowRight, CheckCircle, LucideIcon } from 'lucide-react';

interface VerticalCardProps {
  /**
   * Título de la tarjeta
   */
  title: string;
  /**
   * Descripción corta
   */
  description: string;
  /**
   * Icono del servicio (componente de Lucide React)
   */
  icon: LucideIcon;
  /**
   * Color principal (variable CSS)
   */
  color?: string;
  /**
   * Features/beneficios a mostrar
   */
  features?: string[];
  /**
   * URL de destino
   */
  href: string;
  /**
   * Texto del botón
   */
  buttonText?: string;
  /**
   * Badge opcional (ej: "Próximamente", "Nuevo")
   */
  badge?: string;
  /**
   * Variante de estilo
   */
  variant?: 'default' | 'featured';
}

export function VerticalCard({
  title,
  description,
  icon,
  color = 'var(--tp-brand)',
  features = [],
  href,
  buttonText = 'Conocer Más',
  badge,
  variant = 'default',
}: VerticalCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <Card 
      className={`
        h-full border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group
        ${isFeatured ? 'shadow-lg scale-105 border-[var(--tp-brand)]' : ''}
      `}
    >
      <CardHeader>
        {/* Icono y Badge */}
        <div className="relative mb-4">
          <div className="group-hover:scale-110 transition-transform">
            <IconContainer 
              icon={icon}
              variant={isFeatured ? 'solid-brand' : 'brand'}
              shape="rounded"
              size="lg"
            />
          </div>
          {badge && (
            <div 
              className="absolute -top-2 right-0 text-xs font-bold px-3 py-1 rounded-full text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              {badge}
            </div>
          )}
        </div>

        {/* Título y descripción */}
        <CardTitle className="text-2xl mb-2">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features */}
        {features.length > 0 && (
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Icon 
                  icon={CheckCircle}
                  size="md"
                  variant="brand"
                  className="shrink-0 mt-0.5"
                />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Botón */}
        {buttonText === 'Próximamente' ? (
          <Button 
            variant="outline"
            disabled
            className="w-full cursor-not-allowed opacity-60"
          >
            {buttonText}
          </Button>
        ) : (
          <Link href={href} className="block">
            <Button 
              variant={isFeatured ? 'default' : 'outline'}
              className={`
                w-full transition-all
                ${isFeatured 
                  ? 'bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white shadow-md' 
                  : 'hover:bg-[var(--tp-brand)] hover:text-white'
                }
              `}
            >
              {buttonText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

