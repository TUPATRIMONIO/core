import React from "react";
import GoogleReviewsCarousel from "@/components/GoogleReviewsCarousel";
import { GoogleStatsMetrics } from "@/components/GoogleStatsDisplay";

export interface Metric {
  value: string;
  label: string;
  description: string;
}

export interface TestimonialsSectionProps {
  title: string;
  description: string;
  showGoogleReviews?: boolean;
  metrics: Metric[];
}

export default function TestimonialsSection({
  title,
  description,
  showGoogleReviews = true,
  metrics,
}: TestimonialsSectionProps) {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        {/* Carousel de reseñas de Google */}
        {showGoogleReviews && (
          <div className="mb-12">
            <GoogleReviewsCarousel />
          </div>
        )}

        {/* Métricas destacadas */}
        <div className="bg-gradient-to-br from-[var(--tp-brand-5)] to-[var(--tp-bg-light-20)] rounded-2xl p-12 border-2 border-[var(--tp-brand-20)]">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {metrics.map((metric, index) => (
              index === 1 ? (
                <GoogleStatsMetrics key={index} />
              ) : (
                <div key={index}>
                  <div className="text-5xl font-bold text-[var(--tp-brand)] mb-2">{metric.value}</div>
                  <p className="text-foreground/90 font-medium">{metric.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{metric.description}</p>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

