import React from "react";
import { Button } from "@/components/ui/button";
import { Check, LucideIcon } from "lucide-react";

export interface CTACard {
  type: "personas" | "empresas";
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  ctaText: string;
  ctaHref: string;
  ctaIcon?: LucideIcon;
  badge?: string;
  variant?: "default" | "outline";
}

export interface TrustBarItem {
  icon: LucideIcon;
  text: string;
}

export interface FinalCTASectionProps {
  title: string;
  description: string;
  cards: CTACard[];
  trustBar: TrustBarItem[];
}

export default function FinalCTASection({
  title,
  description,
  cards,
  trustBar,
}: FinalCTASectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] relative overflow-hidden">
      {/* Patrón decorativo de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {title}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {cards.map((card, index) => (
            <div 
              key={index} 
              className={`bg-card rounded-2xl p-8 shadow-2xl ${card.badge ? 'border-4 border-yellow-400 relative' : ''}`}
            >
              {card.badge && (
                <div className="absolute -top-4 right-4 bg-yellow-400 text-foreground px-4 py-1 rounded-full text-sm font-bold">
                  {card.badge}
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className={`w-16 h-16 ${card.type === 'personas' ? 'bg-[var(--tp-brand-10)]' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <card.icon className={`w-8 h-8 ${card.type === 'personas' ? 'text-[var(--tp-brand)]' : 'text-blue-600'}`} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-muted-foreground">{card.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {card.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/80">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {card.variant === "outline" ? (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] py-6 text-lg font-semibold"
                >
                  {card.ctaIcon && <card.ctaIcon className="w-5 h-5 mr-2" />}
                  {card.ctaText}
                </Button>
              ) : (
                <a 
                  href={card.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block w-full"
                >
                  <Button 
                    size="lg" 
                    className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white py-6 text-lg font-semibold"
                  >
                    {card.ctaIcon && <card.ctaIcon className="w-5 h-5 mr-2" />}
                    {card.ctaText}
                  </Button>
                </a>
              )}

              <p className="text-center text-sm text-muted-foreground/80 mt-4">
                {card.type === 'personas' ? '✓ Paga solo por documento finalizado' : '✓ Registro gratuito'}
              </p>
            </div>
          ))}
        </div>

        {/* Trust bar final */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
          {trustBar.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <item.icon className="w-5 h-5" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

