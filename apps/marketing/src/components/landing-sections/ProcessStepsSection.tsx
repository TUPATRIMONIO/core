import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconContainer } from "@tupatrimonio/ui";
import { ArrowRight, Timer, LucideIcon } from "lucide-react";

export interface ProcessStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ProcessStepsSectionProps {
  title: string;
  description: string;
  totalTime: string;
  steps: ProcessStep[];
  ctaText: string;
  ctaSubtext?: string;
  ctaHref: string;
}

export default function ProcessStepsSection({
  title,
  description,
  totalTime,
  steps,
  ctaText,
  ctaSubtext,
  ctaHref,
}: ProcessStepsSectionProps) {
  return (
    <section id="como-funciona" className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
      <div className="max-w-7xl tp-container">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-card rounded-full shadow-md border border-border">
            <Timer className="w-5 h-5 text-[var(--tp-brand)]" />
            <span className="font-bold text-foreground">{totalTime}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all relative">
              <div className="absolute -top-4 -right-4">
                <div className="w-10 h-10 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-lg font-bold shadow-lg">
                  {index + 1}
                </div>
              </div>
              <CardHeader>
                <IconContainer 
                  icon={step.icon} 
                  variant="brand" 
                  shape="rounded" 
                  size="lg" 
                  className="mb-4"
                />
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href={ctaHref} rel="noopener noreferrer nofollow">
            <Button 
              size="lg" 
              className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg"
            >
              {ctaText}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
          {ctaSubtext && (
            <p className="text-sm text-gray-500 mt-3">{ctaSubtext}</p>
          )}
        </div>
      </div>
    </section>
  );
}

