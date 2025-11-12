'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Scale,
  Home,
  TrendingUp,
  Briefcase,
  FileSignature,
  FileCheck,
  Building2,
  BookOpen,
  HelpCircle,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNavigation } from './NavigationProvider';
import { cn } from '@/lib/utils';
import { TikTokIcon } from './icons/TikTokIcon';

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ElementType;
  badge?: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

// Configuración de enlaces del footer
const lineasDeNegocio: FooterLink[] = [
  {
    title: 'Legal Tech',
    href: '/legal-tech',
    icon: Scale,
  },
  {
    title: 'PropTech',
    href: '/proptech',
    icon: Home,
    badge: 'Próximamente',
  },
  {
    title: 'FinTech',
    href: '/fintech',
    icon: TrendingUp,
    badge: 'Próximamente',
  },
  {
    title: 'Business Hub',
    href: '/business-hub',
    icon: Briefcase,
    badge: 'Próximamente',
  },
];

const serviciosPrincipales: FooterLink[] = [
  {
    title: 'Firmas Electrónicas',
    href: '/firmas-electronicas',
  },
  {
    title: 'Notaría Online',
    href: '/notaria-online',
  },
  {
    title: 'Modificaciones de Empresa',
    href: '/modificaciones-empresa',
  },
  {
    title: 'Contrato de Arriendo',
    href: '/cl/contrato-de-arriendo-online',
  },
];

const recursos: FooterLink[] = [
  {
    title: 'Blog',
    href: '/blog',
  },
  {
    title: 'Centro de Ayuda',
    href: '/ayuda',
  },
  {
    title: 'Contacto',
    href: '/contacto',
  },
  {
    title: 'Nosotros',
    href: '/nosotros',
  },
  {
    title: 'Precios',
    href: '/precios',
  },
];

const legal: FooterLink[] = [
  {
    title: 'Términos y Condiciones',
    href: '/legal/terminos',
  },
  {
    title: 'Política de Privacidad',
    href: '/legal/privacidad',
  },
  {
    title: 'Política de Cookies',
    href: '/legal/cookies',
  },
];

const redesSociales: FooterLink[] = [
  {
    title: 'LinkedIn',
    href: 'https://linkedin.com/company/tupatrimonio',
    icon: Linkedin,
    external: true,
  },
  {
    title: 'Instagram',
    href: 'https://instagram.com/tupatrimon.io',
    icon: Instagram,
    external: true,
  },
  {
    title: 'TikTok',
    href: 'https://tiktok.com/@tupatrimonio',
    icon: TikTokIcon,
    external: true,
  },
  {
    title: 'Facebook',
    href: 'https://web.facebook.com/tupatrimonio.oficial/',
    icon: Facebook,
    external: true,
  },
  {
    title: 'YouTube',
    href: 'https://www.youtube.com/@tupatrimonio',
    icon: Youtube,
    external: true,
  },
];

export function MainFooter() {
  const { showNav } = useNavigation();

  if (!showNav) return null;

  return (
    <footer className="bg-[var(--tp-background-dark)] text-white py-12">
      <div className="max-w-7xl tp-container">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Columna 1: Marca */}
          <div>
            <h3 className="text-white font-bold text-xl mb-4 font-quicksand">TuPatrimonio®</h3>
            <p className="text-white/80 mb-4 font-quicksand">
              Tu copiloto para proteger y hacer crecer lo que más te importa. Transformando la gestión legal con tecnología de vanguardia.
            </p>
            <div className="space-y-2 text-sm text-white/70 font-quicksand">
              <p>🇨🇱 TuPatrimonio SpA (Chile)</p>
              <p>🇺🇸 TuPatrimonio LLC (USA)</p>
            </div>
          </div>

          {/* Columna 2: Productos y Soluciones */}
          <div>
            <h4 className="text-white font-bold mb-4 font-quicksand">Productos y Soluciones</h4>
            
            {/* Líneas de Negocio */}
            <div className="mb-4">
              <h5 className="text-white/90 text-sm font-semibold mb-2 font-quicksand">Líneas de Negocio</h5>
              <ul className="space-y-2 text-white/80 text-sm">
                {lineasDeNegocio.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="hover:text-white transition-colors flex items-center gap-2 font-quicksand"
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {link.title}
                        {link.badge && (
                          <span className="text-xs text-white/50">({link.badge})</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Servicios */}
            <div className="mb-4">
              <h5 className="text-white/90 text-sm font-semibold mb-2 font-quicksand">Servicios</h5>
              <ul className="space-y-2 text-white/80 text-sm">
                {serviciosPrincipales.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="hover:text-white transition-colors font-quicksand"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h5 className="text-white/90 text-sm font-semibold mb-2 font-quicksand">Recursos</h5>
              <ul className="space-y-2 text-white/80 text-sm">
                {recursos.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="hover:text-white transition-colors font-quicksand"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Columna 3: Legal y Redes Sociales */}
          <div>
            <h4 className="text-white font-bold mb-4 font-quicksand">Legal</h4>
            <ul className="space-y-2 text-white/80 text-sm mb-6">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="hover:text-white transition-colors font-quicksand"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Redes Sociales */}
            <div>
              <h4 className="text-white font-bold mb-4 font-quicksand">Síguenos</h4>
              <div className="flex gap-4">
                {redesSociales.map((red) => {
                  const Icon = red.icon;
                  return (
                    <a
                      key={red.href}
                      href={red.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-white/70 hover:text-white transition-colors"
                      aria-label={red.title}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-white/20 my-8" />

        <div className="text-center text-white/60 text-sm font-quicksand">
          <p>Copyright © 2025 TuPatrimonio. Todos los derechos reservados.</p>
          <p className="mt-2">
            Plataforma de servicios legales digitales. Operativo en Chile 🇨🇱 · Próximamente en más países de Latinoamérica
          </p>
        </div>
      </div>
    </footer>
  );
}

