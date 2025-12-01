import { NextRequest, NextResponse } from 'next/server';
import { processDocumentRequest } from '@/lib/invoicing/processor';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Configuración para Vercel Cron
export const maxDuration = 60; // 60 segundos máximo para cron jobs

/**
 * GET /api/invoicing/cron
 * 
 * Endpoint de cron job para procesar solicitudes de emisión de documentos pendientes.
 * Este endpoint se llama periódicamente para asegurar que todas las solicitudes
 * se procesen, incluso si pg_net no está disponible o el webhook falló.
 * 
 * Seguridad: Verifica que la petición venga de Vercel Cron (CRON_SECRET)
 * o de un servicio interno autorizado.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('⏰ [Invoicing Cron] Iniciando procesamiento de solicitudes pendientes');

  // Verificar autenticación del cron job
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // En producción, verificar el secret
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Invoicing Cron] Autenticación fallida');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const supabase = createServiceRoleClient();

  try {
    // Obtener solicitudes pendientes
    const { data: requests, error } = await supabase.rpc('get_pending_requests', {
      p_limit: 20, // Procesar máximo 20 por ejecución para evitar timeout
    });

    if (error) {
      throw new Error(`Error obteniendo solicitudes: ${error.message}`);
    }

    if (!requests || requests.length === 0) {
      console.log('[Invoicing Cron] No hay solicitudes pendientes');
      return NextResponse.json({
        success: true,
        message: 'No hay solicitudes pendientes',
        processed: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[Invoicing Cron] Procesando ${requests.length} solicitudes pendientes`);

    // Procesar cada solicitud secuencialmente para evitar sobrecarga
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const req of requests) {
      try {
        const success = await processDocumentRequest(req.id);
        results.push({ id: req.id, success });
        
        if (success) {
          console.log(`[Invoicing Cron] ✓ Solicitud ${req.id} procesada exitosamente`);
        } else {
          console.log(`[Invoicing Cron] ✗ Solicitud ${req.id} falló`);
        }
      } catch (err: any) {
        console.error(`[Invoicing Cron] Error procesando ${req.id}:`, err.message);
        results.push({ id: req.id, success: false, error: err.message });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const duration = Date.now() - startTime;

    console.log(`[Invoicing Cron] Completado: ${successful} exitosos, ${failed} fallidos (${duration}ms)`);

    return NextResponse.json({
      success: true,
      message: `Procesadas ${requests.length} solicitudes`,
      processed: requests.length,
      successful,
      failed,
      duration_ms: duration,
      details: results,
    });
  } catch (error: any) {
    console.error('[Invoicing Cron] Error general:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

