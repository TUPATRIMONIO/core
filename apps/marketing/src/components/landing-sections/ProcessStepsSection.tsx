import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Timer, LucideIcon } from "lucide-react";

export interface ProcessStep {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
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
    <section id="como-funciona" className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200">
            <Timer className="w-5 h-5 text-[var(--tp-brand)]" />
            <span className="font-bold text-gray-900">{totalTime}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                  {index + 1}
                </div>
              </div>
              <div className="mt-8 text-center">
                <div className={`w-16 h-16 bg-${step.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className={`w-8 h-8 text-${step.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
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

