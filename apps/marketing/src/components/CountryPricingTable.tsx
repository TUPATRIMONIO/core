'use client'

import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X } from 'lucide-react';
import { formatCurrency, useCountryConfig } from './CountryRouteWrapper';

interface PricingFeature {
  name: string;
  included: boolean;
  description?: string;
}

interface PricingPlan {
  name: string;
  description: string;
  price: number;
  billingPeriod: 'month' | 'year' | 'once';
  features: PricingFeature[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

interface CountryPricingTableProps {
  /**
   * Código del país
   */
  country: string;
  /**
   * Planes de precios
   */
  plans: PricingPlan[];
  /**
   * Título de la sección
   */
  title?: string;
  /**
   * Descripción de la sección
   */
  description?: string;
}

export function CountryPricingTable({
  country,
  plans,
  title = 'Planes y Precios',
  description = 'Elige el plan que mejor se adapte a tus necesidades',
}: CountryPricingTableProps) {
  const countryConfig = useCountryConfig(country);

  const getBillingText = (period: PricingPlan['billingPeriod']) => {
    switch (period) {
      case 'month':
        return '/mes';
      case 'year':
        return '/año';
      case 'once':
        return 'pago único';
      default:
        return '';
    }
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl tp-container">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
          <div className="mt-6">
            <Badge 
              variant="outline" 
              className="text-sm px-4 py-2 bg-[var(--tp-brand-5)] border-[var(--tp-brand)] text-[var(--tp-brand)]"
            >
              {countryConfig.flag} Precios en {countryConfig.currency} para {countryConfig.name}
            </Badge>
          </div>
        </div>

        {/* Planes */}
        <div className={`grid gap-8 ${plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`
                relative transition-all duration-300 hover:shadow-2xl
                ${plan.highlighted 
                  ? 'border-2 border-[var(--tp-brand)] shadow-xl scale-105 bg-gradient-to-b from-white to-[var(--tp-brand-5)]' 
                  : 'border hover:border-[var(--tp-brand-20)]'
                }
              `}
            >
              {/* Badge destacado */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[var(--tp-brand)] text-white px-4 py-1 shadow-md">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base mb-6">
                  {plan.description}
                </CardDescription>

                {/* Precio */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl md:text-5xl font-bold text-gray-900">
                      {formatCurrency(plan.price, country)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {getBillingText(plan.billingPeriod)}
                  </p>
                </div>

                {/* CTA */}
                <Link href={plan.ctaHref}>
                  <Button
                    className={`
                      w-full
                      ${plan.highlighted 
                        ? 'bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white' 
                        : 'bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white'
                      }
                    `}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardHeader>

              <CardContent>
                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-3"
                    >
                      {feature.included ? (
                        <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span 
                          className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}
                        >
                          {feature.name}
                        </span>
                        {feature.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {feature.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Todos los precios incluyen impuestos. Puedes cambiar o cancelar tu plan en cualquier momento.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>✓ Sin permanencia</span>
            <span>✓ Cancela cuando quieras</span>
            <span>✓ Soporte incluido</span>
          </div>
        </div>
      </div>
    </section>
  );
}

