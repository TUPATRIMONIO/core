'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Cookie, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const legalPages = [
  {
    href: '/legal/terminos',
    label: 'Términos de Servicio',
    icon: FileText,
  },
  {
    href: '/legal/cookies',
    label: 'Política de Cookies',
    icon: Cookie,
  },
  {
    href: '/legal/privacidad',
    label: 'Política de Privacidad',
    icon: Shield,
  },
];

export function LegalNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-card border border-border rounded-lg p-4 mb-8">
      <h3 className="text-sm font-semibold text-foreground mb-4 px-2">
        Documentos Legales
      </h3>
      <ul className="space-y-1">
        {legalPages.map((page) => {
          const isActive = pathname === page.href;
          const Icon = page.icon;
          
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--tp-brand-10)] text-[var(--tp-brand)] font-semibold'
                    : 'text-muted-foreground hover:bg-[var(--tp-bg-light-20)] hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {page.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

