import { NextRequest, NextResponse } from 'next/server';
import { POST as syncPost } from '../../reviews/sync/route';

/**
 * Endpoint específico para Vercel Cron Jobs
 * Vercel hace peticiones GET a este endpoint diariamente
 * Este endpoint ejecuta la sincronización de reseñas de Google
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que la petición viene de Vercel Cron
    const userAgent = request.headers.get('user-agent');
    
    // Vercel Cron siempre envía este user-agent
    if (!userAgent?.includes('vercel-cron/1.0')) {
      console.log('❌ Request no viene de Vercel Cron:', userAgent);
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'This endpoint is only accessible by Vercel Cron Jobs'
        },
        { status: 401 }
      );
    }

    console.log('✅ Cron job triggered by Vercel at:', new Date().toISOString());

    // Crear un request POST con force=true para la sincronización
    const syncUrl = new URL(request.url);
    syncUrl.pathname = '/api/reviews/sync';
    syncUrl.searchParams.set('force', 'true');
    
    const syncRequest = new NextRequest(syncUrl.toString(), {
      method: 'POST',
    });

    // Ejecutar la sincronización
    const result = await syncPost(syncRequest);

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString(),
      sync_result: await result.json(),
    });

  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Cron job failed',
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

