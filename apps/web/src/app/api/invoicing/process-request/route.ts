import { NextRequest, NextResponse } from 'next/server';
import { processEmissionRequest } from '@/lib/invoicing/processor';

/**
 * POST /api/invoicing/process-request
 * 
 * Procesa una solicitud de emisión de documento tributario.
 * Puede ser llamado por:
 * - Webhook interno desde el trigger de base de datos
 * - Cron job para procesar solicitudes pendientes
 * - Llamada manual para reintentar una solicitud fallida
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request_id, order_id } = body;

    // Validar que se proporcione request_id
    if (!request_id) {
      return NextResponse.json(
        { error: 'request_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que es una llamada interna (desde trigger o cron)
    const isInternal = request.headers.get('X-Internal-Request') === 'true';
    if (!isInternal) {
      // En producción, podrías requerir autenticación aquí
      // Por ahora, permitimos llamadas externas para testing
      console.warn('[process-request] Llamada externa sin autenticación');
    }

    console.log('[process-request] Procesando solicitud:', {
      request_id,
      order_id,
      isInternal,
    });

    // Procesar la solicitud
    const success = await processEmissionRequest(request_id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Solicitud procesada exitosamente',
        request_id,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Error procesando solicitud',
          request_id,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[process-request] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoicing/process-request
 * 
 * Endpoint para verificar el estado de una solicitud o procesar solicitudes pendientes
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const request_id = searchParams.get('request_id');
  const process_pending = searchParams.get('process_pending') === 'true';

  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = createServiceRoleClient();

    // Si se solicita procesar pendientes
    if (process_pending) {
      // Obtener solicitudes pendientes
      const { data: pendingRequests, error } = await supabase
        .from('emission_requests')
        .select('id')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('[process-request] Error obteniendo solicitudes pendientes:', error);
        throw error;
      }

      if (!pendingRequests || pendingRequests.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No hay solicitudes pendientes',
          processed: 0,
          results: [],
        });
      }

      const results = [];
      for (const req of pendingRequests) {
        try {
          console.log('[process-request] Procesando solicitud:', req.id);
          const success = await processEmissionRequest(req.id);
          results.push({ request_id: req.id, success });
        } catch (err: any) {
          console.error('[process-request] Error procesando solicitud:', req.id, err);
          results.push({ request_id: req.id, success: false, error: err.message });
        }
      }

      return NextResponse.json({
        success: true,
        processed: results.length,
        results,
      });
    }

    // Si se proporciona request_id, obtener su estado
    if (request_id) {
      const { data: request, error } = await supabase
        .from('emission_requests')
        .select('*')
        .eq('id', request_id)
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        request,
      });
    }

    return NextResponse.json(
      { error: 'Se requiere request_id o process_pending=true' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[process-request] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

