"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { CheckCircle, Coins, ShoppingCart, ArrowRight } from "lucide-react";

interface PointsPackage {
  points: number;
  price: number;
  href: string;
}

const packages: PointsPackage[] = [
  { 
    points: 10000, 
    price: 10000,
    href: "https://tupatrimon.io/producto/10-000-puntos/"
  },
  { 
    points: 50000, 
    price: 50000,
    href: "https://tupatrimon.io/producto/50-000-puntos/"
  },
  { 
    points: 100000, 
    price: 100000,
    href: "https://tupatrimon.io/producto/100-000-puntos/"
  },
  { 
    points: 500000, 
    price: 500000,
    href: "https://tupatrimon.io/producto/500-000-puntos/"
  },
  { 
    points: 1000000, 
    price: 1000000,
    href: "https://tupatrimon.io/producto/1-000-000-puntos/"
  },
];

const PAYMENT_DISCOUNT = 2; // 2% de descuento al pagar con puntos

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-CL').format(num);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function PointsPackages() {
  const [selectedPackage, setSelectedPackage] = useState(packages[2]); // Default: 100K

  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <div className="mb-6">
          <IconContainer 
            icon={Coins} 
            variant="brand" 
            shape="circle" 
            size="md"
            className="mx-auto"
          />
        </div>
        <h2 className="mb-4">Sistema de Puntos</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
          Compra puntos y obtén 2% de descuento adicional al usarlos. Cada punto equivale a $1.
        </p>
        {/* Beneficio destacado */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 rounded-full border-2 border-green-200 dark:border-green-800">
          <Icon icon={CheckCircle} size="sm" className="text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-green-700 dark:text-green-300">
            2% de descuento extra al pagar con puntos
          </span>
        </div>
      </div>

      {/* Selector de Paquetes y Vista Principal */}
      <div className="max-w-5xl mx-auto">
        <Card className="border-2 border-[var(--tp-brand)] shadow-2xl overflow-hidden bg-card">
          <CardHeader className="text-center pt-10 pb-8 border-b border-border">
            <h3 className="mb-6">Elige tu paquete de puntos</h3>
            
            {/* Grid de opciones de paquetes */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {packages.map((pkg) => (
                <button
                  key={pkg.points}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPackage.points === pkg.points
                      ? 'border-[var(--tp-brand)] bg-[var(--tp-brand-5)] shadow-lg'
                      : 'border-border hover:border-[var(--tp-brand-20)] bg-background dark:bg-muted/20'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-foreground mb-1">
                      {formatNumber(pkg.points)}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Puntos
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-8 md:p-12">
            {/* Display del paquete seleccionado */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Columna izquierda - Información */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon={Coins} size="lg" className="text-[var(--tp-brand)]" />
                    <h4 className="font-bold">Paquete seleccionado</h4>
                  </div>
                  <div className="bg-[var(--tp-background-light)] dark:bg-muted/20 rounded-xl p-6 border border-border">
                    <div className="text-4xl font-bold text-[var(--tp-brand)] mb-2">
                      {formatNumber(selectedPackage.points)}
                    </div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Puntos TuPatrimonio</p>
                  </div>
                </div>

                {/* Beneficios */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-background dark:bg-card rounded-lg border border-border">
                    <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-sm mb-0.5">Equivalencia real</h5>
                      <p className="text-xs text-muted-foreground">Vale {formatPrice(selectedPackage.points)} en servicios</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-background dark:bg-card rounded-lg border border-border">
                    <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-sm mb-0.5">Sin vencimiento</h5>
                      <p className="text-xs text-muted-foreground">Úsalos cuando quieras</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-background dark:bg-card rounded-lg border border-border">
                    <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-sm mb-0.5">Uso flexible</h5>
                      <p className="text-xs text-muted-foreground">Pago total o parcial</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Precio y CTA */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="bg-[var(--tp-background-light)] dark:bg-muted/20 rounded-2xl p-8 text-center mb-6 border-2 border-border">
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Precio del paquete</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-5xl font-bold text-[var(--tp-brand)]">
                        {formatPrice(selectedPackage.price)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      1 punto = $1
                    </p>
                  </div>

                  {/* Beneficio de pago */}
                  <div className="text-center mb-6">
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400" />
                        <span className="text-lg font-bold text-green-700 dark:text-green-300">
                          +{PAYMENT_DISCOUNT}% descuento
                        </span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Al usar estos puntos como medio de pago
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <a 
                  href={selectedPackage.href}
                  rel="noopener noreferrer nofollow"
                  className="block"
                >
                  <Button 
                    size="lg"
                    className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar {formatNumber(selectedPackage.points)} Puntos
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="mt-8 pt-8 border-t-2 border-border">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <Icon icon={Coins} size="md" className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      ¿Cómo funcionan?
                    </h5>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Compra puntos a valor 1:1 (1 punto = $1) y úsalos para pagar cualquier servicio en nuestra plataforma.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-green-700 dark:text-green-300 mb-1">
                      Beneficio exclusivo
                    </h5>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Al pagar con puntos, obtienes automáticamente {PAYMENT_DISCOUNT}% de descuento adicional en el checkout.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

