import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

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
   * Icono del servicio
   */
  icon: ReactNode;
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
        h-full transition-all duration-300 hover:shadow-xl group
        ${isFeatured 
          ? 'border-2 shadow-lg scale-105' 
          : 'border-2 border-border hover:shadow-lg'
        }
      `}
      style={{
        // @ts-ignore
        '--hover-color': color,
        ...(isFeatured ? { borderColor: color } : {}),
      } as React.CSSProperties}
    >
      <CardHeader>
        {/* Icono y Badge */}
        <div className="relative mb-4">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
          >
            <div className="text-white w-7 h-7">
              {icon}
            </div>
          </div>
          {badge && (
            <div 
              className="absolute -top-2 -right-2 text-xs font-bold px-2 py-1 rounded-full text-white shadow-md"
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
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle 
                  className="w-5 h-5 shrink-0 mt-0.5" 
                  style={{ color }}
                />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Botón */}
        <Link href={href} className="block">
          <Button 
            variant={isFeatured ? 'default' : 'outline'}
            className={`
              w-full transition-all
              ${isFeatured 
                ? 'text-white shadow-md hover:opacity-90' 
                : 'hover:text-white'
              }
            `}
            style={
              isFeatured 
                ? { backgroundColor: color }
                : {
                    // @ts-ignore
                    '--hover-bg': color,
                  } as React.CSSProperties
            }
          >
            {buttonText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

