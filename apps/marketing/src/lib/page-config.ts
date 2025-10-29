/**
 * Configuración Central de Páginas - TuPatrimonio Marketing
 * 
 * Fuente de verdad para configuración de páginas estáticas.
 * Esta configuración se usa para:
 * - Metadata SEO (robots, indexación)
 * - Control de acceso básico
 * - Auditoría en dashboard
 */

export interface PageConfigEntry {
  seoIndex: boolean;
  status: 'public' | 'coming-soon' | 'draft';
  access?: 'public' | 'admin';
  section?: string;
  notes?: string;
}

/**
 * Configuración de todas las páginas del sitio
 */
export const PAGE_CONFIG: Record<string, PageConfigEntry> = {
  // ==========================================
  // PÁGINAS GLOBALES
  // ==========================================
  '/': { 
    seoIndex: true, 
    status: 'public',
    section: 'home',
    notes: 'Landing page principal'
  },
  '/blog': { 
    seoIndex: true, 
    status: 'public',
    section: 'blog',
    notes: 'Índice del blog'
  },
  '/ayuda': { 
    seoIndex: true, 
    status: 'public',
    section: 'help',
    notes: 'Centro de ayuda y FAQ'
  },

  // ==========================================
  // CHILE - LIVE
  // ==========================================
  '/cl': { 
    seoIndex: true, 
    status: 'public',
    section: 'home',
    notes: 'Landing page Chile'
  },
  '/cl/firmas-electronicas': { 
    seoIndex: true, 
    status: 'public',
    section: 'firmas',
    notes: 'Firmas electrónicas Chile'
  },
  '/cl/verificacion-identidad': { 
    seoIndex: true, 
    status: 'public',
    section: 'kyc',
    notes: 'KYC para Chile'
  },
  '/cl/notaria-digital': { 
    seoIndex: true, 
    status: 'public',
    section: 'notaria',
    notes: 'Notaría digital Chile'
  },
  '/cl/precios': { 
    seoIndex: true, 
    status: 'public',
    section: 'precios',
    notes: 'Planes y precios Chile'
  },
  '/cl/contacto': { 
    seoIndex: true, 
    status: 'public',
    section: 'contacto',
    notes: 'Página de contacto Chile'
  },
  '/cl/legal/terminos': { 
    seoIndex: false, 
    status: 'public',
    section: 'legal',
    notes: 'Términos y condiciones Chile'
  },
  '/cl/legal/privacidad': { 
    seoIndex: false, 
    status: 'public',
    section: 'legal',
    notes: 'Política de privacidad Chile'
  },
  '/cl/legal/cookies': { 
    seoIndex: false, 
    status: 'public',
    section: 'legal',
    notes: 'Política de cookies Chile'
  },

  // ==========================================
  // MÉXICO - COMING SOON (NO INDEXAR)
  // ==========================================
  '/mx': { 
    seoIndex: false, 
    status: 'coming-soon',
    section: 'home',
    notes: 'Landing México - próximamente'
  },
  '/mx/precios': { 
    seoIndex: false, 
    status: 'coming-soon',
    section: 'precios',
    notes: 'Precios México - en desarrollo'
  },
  '/mx/contacto': { 
    seoIndex: false, 
    status: 'coming-soon',
    section: 'contacto',
    notes: 'Contacto México - próximamente'
  },

  // ==========================================
  // COLOMBIA - COMING SOON (NO INDEXAR)
  // ==========================================
  '/co': { 
    seoIndex: false, 
    status: 'coming-soon',
    section: 'home',
    notes: 'Landing Colombia - próximamente'
  },
  '/co/precios': { 
    seoIndex: false, 
    status: 'coming-soon',
    section: 'precios',
    notes: 'Precios Colombia - en desarrollo'
  },
  '/co/contacto': { 
    seoIndex: false, 
    status: 'coming-soon',
    section: 'contacto',
    notes: 'Contacto Colombia - próximamente'
  },

  // ==========================================
  // RUTAS ADMINISTRATIVAS (NO INDEXAR)
  // ==========================================
  '/dashboard': { 
    seoIndex: false, 
    status: 'public',
    access: 'admin',
    section: 'admin',
    notes: 'Dashboard principal'
  },
  '/dashboard/pages': { 
    seoIndex: false, 
    status: 'public',
    access: 'admin',
    section: 'admin',
    notes: 'Gestión de páginas'
  },
  '/dashboard/blog': { 
    seoIndex: false, 
    status: 'public',
    access: 'admin',
    section: 'admin',
    notes: 'Gestión de blog'
  },
  '/dashboard/users': { 
    seoIndex: false, 
    status: 'public',
    access: 'admin',
    section: 'admin',
    notes: 'Gestión de usuarios'
  },
} as const;

/**
 * Obtiene la configuración de una página específica
 * Si no existe, retorna configuración por defecto (pública e indexable)
 */
export function getPageConfig(path: string): PageConfigEntry {
  return PAGE_CONFIG[path] || { 
    seoIndex: true, 
    status: 'public',
    notes: 'Página sin configuración específica'
  };
}

/**
 * Verifica si una ruta requiere acceso admin
 */
export function requiresAdminAccess(path: string): boolean {
  const config = getPageConfig(path);
  return config.access === 'admin';
}

/**
 * Obtiene todas las páginas de un status específico
 */
export function getPagesByStatus(status: PageConfigEntry['status']): string[] {
  return Object.entries(PAGE_CONFIG)
    .filter(([_, config]) => config.status === status)
    .map(([path]) => path);
}

/**
 * Obtiene todas las páginas indexables
 */
export function getIndexablePages(): string[] {
  return Object.entries(PAGE_CONFIG)
    .filter(([_, config]) => config.seoIndex && config.status === 'public')
    .map(([path]) => path);
}

