import { NextResponse } from 'next/server';

/**
 * API Route para servir información de versión de la aplicación
 * Reemplaza el archivo estático version.json con un endpoint dinámico
 * 
 * GET /version.json
 * Retorna: { version, buildId, deployedAt }
 */
export async function GET() {
  try {
    // Generar información de versión dinámica
    const versionInfo = {
      version: `${Date.now()}`,
      buildId: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 
               process.env.NEXT_BUILD_ID || 
               `marketing-${Date.now().toString().slice(-8)}`,
      deployedAt: new Date().toISOString(),
      app: 'marketing'
    };
    
    console.log('📡 [API /version.json] Serving version info:', versionInfo);
    
    return NextResponse.json(versionInfo, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        // CORS headers para desarrollo
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma',
      },
    });
  } catch (error) {
    console.error('❌ [API /version.json] Error generating version info:', error);
    
    // Fallback version en caso de error
    return NextResponse.json({
      version: `${Date.now()}`,
      buildId: 'error-fallback',
      deployedAt: new Date().toISOString(),
      app: 'marketing',
      error: true
    }, {
      status: 200, // Retornar 200 para evitar que el frontend falle
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

// Método OPTIONS para CORS (si es necesario)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma',
    },
  });
}
