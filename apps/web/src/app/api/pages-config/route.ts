/**
 * API Proxy: Configuración de Páginas
 * 
 * Actúa como proxy entre el dashboard y la API de marketing.
 * Esto evita problemas de CORS al hacer fetch desde el cliente.
 * 
 * Flow:
 * Cliente (dashboard) → Esta API (mismo origen) → Marketing API → Respuesta
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3001';
    
    // Fetch desde el servidor (sin restricciones CORS)
    const response = await fetch(`${marketingUrl}/api/pages-config`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Marketing API returned error:', response.status, response.statusText);
      throw new Error(`Marketing API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Retornar datos con cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error proxying pages config from marketing:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pages configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

