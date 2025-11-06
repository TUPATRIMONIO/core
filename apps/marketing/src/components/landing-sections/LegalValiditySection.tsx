import React from "react";
import { LucideIcon } from "lucide-react";

export interface FAQItem {
  question: string;
  answer: React.ReactNode;
  icon: LucideIcon;
}

export interface LegalValiditySectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  faqs: FAQItem[];
}

export default function LegalValiditySection({
  title,
  description,
  icon: Icon,
  faqs,
}: LegalValiditySectionProps) {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Icon className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-4" />
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gradient-to-br from-card to-[var(--tp-background-light)] rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-start gap-3">
                <faq.icon className="w-7 h-7 text-green-600 flex-shrink-0 mt-1" />
                {faq.question}
              </h3>
              <div className="pl-10 space-y-3 text-foreground/80 leading-relaxed">
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

