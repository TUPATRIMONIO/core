import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import PriceCalculator from "@/components/pricing/PriceCalculator";
import SignatureComparisonTable from "@/components/pricing/SignatureComparisonTable";
import NotarialServicesTable from "@/components/pricing/NotarialServicesTable";
import PointsPackages from "@/components/pricing/PointsPackages";
import VolumeDiscounts from "@/components/pricing/VolumeDiscounts";
import RefundPolicy from "@/components/pricing/RefundPolicy";
import { USERS_COUNT } from "@/lib/constants";
import { Zap, Lock, Users, Percent, Coins as CoinsIcon, RefreshCcw, ArrowRight, Calculator as CalculatorIcon, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Precios - Firma Electrónica y Servicios Notariales | TuPatrimonio Chile",
  description: "Firma Electrónica Simple desde $6.990, servicios notariales desde $8.990. Sistema de puntos con descuentos hasta 9%. Reembolso garantizado.",
  keywords: [
    "precios firma electrónica chile",
    "costo firma electrónica",
    "precio notaría digital",
    "firma electrónica simple precio",
    "firma electrónica avanzada precio",
    "notaría online chile precios",
    "descuentos firma electrónica"
  ],
  openGraph: {
    title: "Precios - Firma Electrónica y Servicios Notariales | TuPatrimonio",
    description: "FES desde $6.990, servicios notariales desde $8.990. Sistema de puntos con descuentos. Reembolso garantizado.",
    url: "https://tupatrimonio.app/cl/precios",
    images: [
      {
        url: "/og-precios.jpg",
        width: 1200,
        height: 630,
        alt: "Precios TuPatrimonio Chile"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios - Firma Electrónica y Servicios Notariales Chile",
    description: "FES desde $6.990, servicios notariales desde $8.990. Descuentos automáticos por volumen.",
    images: ["/og-precios.jpg"],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/cl/precios",
  },
};

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-background py-20">
        <div className="max-w-7xl tp-container">
          <div className="text-center">
            <h1 className="mb-6">
              Precios <span className="text-[var(--tp-brand)]">Transparentes</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto">
              Paga solo por lo que usas. Sin suscripciones mensuales, sin ataduras. 
              Simplemente elige el servicio que necesitas y listo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <a href="https://tupatrimon.io/legalizacion-de-documentos-electronicos/" rel="noopener noreferrer nofollow">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Comenzar mi trámite
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="#calculadora">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] px-10 py-6 text-lg font-semibold"
                >
                  <CalculatorIcon className="w-5 h-5 mr-2" />
                  Calcular mi Precio
                </Button>
              </a>
            </div>
            
            {/* Métricas del sistema */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={Users} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 text-sm font-medium">{USERS_COUNT.shortUpper} Usuarios</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={FileCheck} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 text-sm font-medium">+60K Documentos</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={Zap} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 text-sm font-medium">En Minutos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa de Firma Electrónica */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <SignatureComparisonTable />
        </div>
      </section>

      {/* Comparativa de Servicios Notariales */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
        <div className="max-w-7xl tp-container">
          <NotarialServicesTable />
        </div>
      </section>

      {/* Calculadora de Precios */}
      <section id="calculadora" className="py-20 bg-background">
        <div className="max-w-4xl tp-container">
          <PriceCalculator />
        </div>
      </section>

      {/* Sistema de Puntos */}
      <section id="descuentos" className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <PointsPackages />
        </div>
      </section>

      {/* Descuentos por Volumen */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <VolumeDiscounts />
        </div>
      </section>

      {/* Política de Reembolsos */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
        <div className="max-w-4xl tp-container">
          <RefundPolicy />
        </div>
      </section>

      {/* Preguntas Frecuentes */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl tp-container">
          <div className="text-center mb-12">
            <h2 className="mb-4">Preguntas Frecuentes</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Todo lo que necesitas saber sobre precios, descuentos y reembolsos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pregunta 1 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={Percent} 
                    variant="brand" 
                    shape="circle" 
                    size="md"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>¿Existen descuentos?</CardTitle>
                <CardDescription>
                  Sí. Accede a descuentos automáticos según la cantidad de documentos realizados en los últimos 6 meses.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Pregunta 2 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={CoinsIcon} 
                    variant="brand" 
                    shape="circle" 
                    size="md"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>¿Cómo funcionan los puntos?</CardTitle>
                <CardDescription>
                  Compra puntos a valor 1:1 y obtén 2% de descuento adicional automáticamente al usarlos como medio de pago en cualquier servicio.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Pregunta 3 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group text-center">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  <IconContainer 
                    icon={RefreshCcw} 
                    variant="brand" 
                    shape="circle" 
                    size="md"
                    className="mx-auto"
                  />
                </div>
                <CardTitle>¿Hay reembolsos?</CardTitle>
                <CardDescription>
                  Sí. Puedes solicitar reembolso si el pedido no está finalizado y dentro de los 30 días desde la compra.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final con patrón decorativo */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] relative overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl tp-container text-center relative z-10">
          <h2 className="text-white mb-6">
            Comienza a legalizar tus documentos hoy
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Sin configuración compleja, sin costos ocultos, sin trámites presenciales. 
            Todo desde la comodidad de tu casa u oficina.
          </p>
          
          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <a href="https://tupatrimon.io/legalizacion-de-documentos-electronicos/" rel="noopener noreferrer nofollow">
              <Button 
                size="lg" 
                className="bg-white text-[var(--tp-brand)] hover:bg-gray-100 dark:hover:bg-gray-200 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Comenzar mi trámite
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="https://tupatrimon.io/contacto/" rel="noopener noreferrer nofollow">
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white border-2 border-white hover:bg-white/10 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Hablar con soporte
              </Button>
            </a>
          </div>

          {/* Trust bar con métricas */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon={Users} size="md" variant="white" />
              <span>{USERS_COUNT.shortUpper} Usuarios Confían</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={FileCheck} size="md" variant="white" />
              <span>+60K Documentos Firmados</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Zap} size="md" variant="white" />
              <span>Resultados en Minutos</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
