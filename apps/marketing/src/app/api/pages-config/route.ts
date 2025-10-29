/**
 * API Route: Configuración de Páginas
 * 
 * Expone la configuración de páginas estáticas desde page-config.ts
 * para que el dashboard de la app web pueda consultarlas.
 * 
 * Esta es la fuente de verdad única - las páginas se definen en código.
 */

import { NextResponse } from 'next/server';
import { PAGE_CONFIG } from '@/lib/page-config';

export async function GET() {
  try {
    // Convertir PAGE_CONFIG a formato compatible con el dashboard
    const pages = Object.entries(PAGE_CONFIG).map(([route_path, config]) => {
      // Extraer código de país de la ruta si existe
      const countryMatch = route_path.match(/^\/(cl|mx|co|ar|pe)\//);
      const country_code = countryMatch ? countryMatch[1] : null;

      return {
        id: route_path, // Usar route_path como ID único
        route_path,
        page_title: config.notes || route_path,
        status: config.status,
        seo_index: config.seoIndex,
        allowed_roles: config.access === 'admin' ? ['admin'] : ['public'],
        country_code,
        section: config.section || 'general',
        notes: config.notes,
        created_at: new Date().toISOString(), // Placeholder
        updated_at: new Date().toISOString(), // Placeholder
      };
    });

    return NextResponse.json(pages, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error generating pages config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración de páginas' },
      { status: 500 }
    );
  }
}

