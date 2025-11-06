import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";

export interface FAQQuestion {
  question: string;
  answer: string;
}

export interface FAQCategory {
  name: string;
  icon: LucideIcon;
  color: string;
  questions: FAQQuestion[];
}

export interface FAQSectionProps {
  title: string;
  description: string;
  categories: FAQCategory[];
  contactCta: {
    text: string;
    href: string;
  };
}

export default function FAQSection({
  title,
  description,
  categories,
  contactCta,
}: FAQSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="space-y-6">
          {categories.map((category, catIndex) => (
            <div key={catIndex} className={`bg-card rounded-2xl p-8 shadow-lg border-l-4 border-${category.color}-500`}>
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <category.icon className={`w-8 h-8 text-${category.color}-600`} />
                {category.name}
              </h3>
              
              <div className="space-y-6">
                {category.questions.map((question, qIndex) => (
                  <div key={qIndex}>
                    <h4 className="font-bold text-lg text-foreground mb-2">
                      {question.question}
                    </h4>
                    <p className="text-foreground/80 leading-relaxed">
                      {question.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">¿No encontraste respuesta a tu pregunta?</p>
          <Button 
            asChild
            size="lg" 
            variant="outline"
            className="border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)]"
          >
            <Link href={contactCta.href} target="_blank" rel="noopener noreferrer nofollow">
              {contactCta.text}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

