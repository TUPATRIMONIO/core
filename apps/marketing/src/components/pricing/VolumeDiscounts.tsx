import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { TrendingUp, Award, Trophy, Star, Crown, Zap } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DiscountTier {
  orders: number;
  discount: number;
  icon: LucideIcon;
}

const discountTiers: DiscountTier[] = [
  { 
    orders: 50, 
    discount: 5,
    icon: Award
  },
  { 
    orders: 100, 
    discount: 10,
    icon: Trophy
  },
  { 
    orders: 150, 
    discount: 15,
    icon: Star
  },
  { 
    orders: 200, 
    discount: 20,
    icon: Crown
  },
];

export default function VolumeDiscounts() {
  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h2 className="mb-4">
          Descuentos por Volumen
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Mientras más usas nuestros servicios, más ahorras. Descuentos automáticos según tus pedidos finalizados.
        </p>
      </div>

      {/* Grid de descuentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {discountTiers.map((tier, index) => (
          <Card 
            key={tier.orders}
            className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group bg-card animate-in fade-in-50 slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="text-center pt-8 pb-6">
              <div className="mb-4 group-hover:scale-110 transition-transform">
                <IconContainer 
                  icon={tier.icon} 
                  variant="brand" 
                  shape="circle" 
                  size="md"
                  className="mx-auto"
                />
              </div>
            </CardHeader>

            <CardContent className="text-center pb-8">
              {/* Porcentaje de Descuento */}
              <div className="text-5xl font-bold text-[var(--tp-brand)] mb-3">
                {tier.discount}%
              </div>
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide font-medium">Descuento</p>
              
              {/* Requisito */}
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon icon={TrendingUp} size="sm" className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-foreground">
                    {tier.orders}+ pedidos
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  finalizados exitosamente
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nota informativa */}
      <div className="mt-10 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <Icon icon={Zap} size="md" className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
              Descuentos automáticos
            </h5>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Se aplican en el checkout según tus pedidos finalizados en los últimos 2 meses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

