import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconContainer } from "@tupatrimonio/ui";
import { Award, Check, LucideIcon } from "lucide-react";

export interface CompetitorFeature {
  name: string;
  ours: {
    value: string;
    highlight?: boolean;
  };
  competitors: string;
}

export interface USP {
  icon: LucideIcon;
  title: string;
  description: string[];
}

export interface CompetitorComparisonSectionProps {
  title: string;
  description: string;
  highlightedColumn: string;
  features: CompetitorFeature[];
  usps: USP[];
}

export default function CompetitorComparisonSection({
  title,
  description,
  highlightedColumn,
  features,
  usps,
}: CompetitorComparisonSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
      <div className="max-w-7xl tp-container">
        <div className="text-center mb-12">
          <h2 className="mb-4">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        {/* Tabla comparativa */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full border-collapse bg-card shadow-xl rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-[var(--tp-brand)] to-[var(--tp-brand-light)]">
                <th className="px-6 py-4 text-left text-white font-bold">Característica</th>
                <th className="px-6 py-4 text-center text-white font-bold bg-[var(--tp-brand-dark)]">
                  <div className="flex flex-col items-center">
                    <Award className="w-6 h-6 mb-1" />
                    <span>{highlightedColumn}</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-white font-bold">Otros Proveedores</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {features.map((feature, index) => (
                <tr key={index} className={`${index < features.length - 1 ? 'border-b border-border' : ''} hover:bg-accent/50`}>
                  <td className="px-6 py-4 font-medium text-foreground">{feature.name}</td>
                  <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-950">
                    <span className="font-semibold text-green-600">{feature.ours.value}</span>
                    <Check className="w-5 h-5 text-green-600 inline-block ml-2" />
                  </td>
                  <td className="px-6 py-4 text-center text-muted-foreground">{feature.competitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3 USPs destacados */}
        <div className="grid md:grid-cols-3 gap-8">
          {usps.map((usp, index) => (
            <Card key={index} className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <IconContainer 
                  icon={usp.icon} 
                  variant="brand" 
                  shape="rounded" 
                  size="lg" 
                  className="mb-4"
                />
                <CardTitle>{usp.title}</CardTitle>
                {usp.description.map((paragraph, idx) => (
                  <CardDescription key={idx} className={idx > 0 ? "mt-4" : ""}>
                    {paragraph}
                  </CardDescription>
                ))}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

