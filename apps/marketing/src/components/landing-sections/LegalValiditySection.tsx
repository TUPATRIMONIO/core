import React from "react";
import { Icon } from "@tupatrimonio/ui";
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
      <div className="max-w-7xl tp-container">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Icon icon={icon} size="xl" variant="brand" />
          </div>
          <h2 className="mb-4">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gradient-to-br from-card to-[var(--tp-background-light)] rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="mb-4 flex items-start gap-3">
                <Icon icon={faq.icon} size="lg" variant="brand" className="flex-shrink-0 mt-1" />
                {faq.question}
              </h3>
              <div className="pl-10 space-y-3">
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

