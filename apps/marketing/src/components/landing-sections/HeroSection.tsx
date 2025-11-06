import React from "react";
import { Button } from "@/components/ui/button";
import { ImagotipoImage } from "@tupatrimonio/assets";
import { LucideIcon } from "lucide-react";

export interface TrustBadge {
  icon?: LucideIcon;
  text?: string;
  component?: React.ReactNode;
}

export interface ValueBullet {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export interface CTAButton {
  text: string;
  href: string;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
}

export interface BottomBadge {
  icon: LucideIcon;
  text: string;
  description: string;
}

export interface HeroSectionProps {
  title: React.ReactNode;
  subtitle: string;
  trustBadges: TrustBadge[];
  valueBullets: ValueBullet[];
  ctaButtons: CTAButton[];
  ctaSubtext?: string;
  bottomBadges: BottomBadge[];
  showImageotype?: boolean;
}

export default function HeroSection({
  title,
  subtitle,
  trustBadges,
  valueBullets,
  ctaButtons,
  ctaSubtext,
  bottomBadges,
  showImageotype = true,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-[var(--tp-background-light)] to-background pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Imagotipo TuPatrimonio */}
          {showImageotype && (
            <div className="flex justify-center mb-8">
              <ImagotipoImage width={120} height={150} priority />
            </div>
          )}
          
          {/* Trust badges superiores */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {trustBadges.map((badge, index) => (
              badge.component ? (
                <React.Fragment key={index}>{badge.component}</React.Fragment>
              ) : (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-background dark:bg-card rounded-full shadow-sm border border-[var(--tp-lines-20)]"
                >
                  {badge.icon && <badge.icon className="w-4 h-4 text-[var(--tp-brand)]" />}
                  <span className="text-sm font-medium text-foreground/80">{badge.text}</span>
                </div>
              )
            ))}
          </div>

          {/* H1 Principal */}
          <h1 className="text-4xl md:text-6xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            {title}
          </h1>

          {/* Subtítulo H2 */}
          <h2 className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            {subtitle}
          </h2>

          {/* 3 Bullets de valor */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {valueBullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-3 text-left">
                <div className={`w-6 h-6 rounded-full bg-${bullet.color}-100 flex items-center justify-center flex-shrink-0 mt-1`}>
                  <bullet.icon className={`w-4 h-4 text-${bullet.color}-600`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{bullet.title}</p>
                  <p className="text-sm text-muted-foreground">{bullet.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            {ctaButtons.map((button, index) => (
              <a key={index} href={button.href} rel="noopener noreferrer nofollow">
                <Button 
                  size="lg" 
                  variant={button.variant || "default"}
                  className={
                    button.variant === "outline"
                      ? "border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                      : "bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  }
                >
                  {button.icon && <button.icon className="w-5 h-5 mr-2" />}
                  {button.text}
                </Button>
              </a>
            ))}
          </div>

          {ctaSubtext && (
            <p className="text-sm text-muted-foreground/80">{ctaSubtext}</p>
          )}

          {/* Trust badges inferiores */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-border">
            {bottomBadges.map((badge, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-card rounded-lg shadow-sm flex items-center justify-center mx-auto mb-2 border border-border">
                  <badge.icon className="w-8 h-8 text-[var(--tp-brand)]" />
                </div>
                <p className="text-xs text-muted-foreground font-medium" dangerouslySetInnerHTML={{ __html: badge.text }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

