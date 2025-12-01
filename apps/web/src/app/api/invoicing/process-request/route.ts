import { NextRequest, NextResponse } from 'next/server';
import { processDocumentRequest } from '@/lib/invoicing/processor';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/invoicing/process-request
 * 
 * Webhook interno que procesa solicitudes de emisión de documentos.
 * 
 * Puede ser llamado por:
 * - Trigger de BD usando pg_net
 * - Cron job para procesar solicitudes pendientes
 * - Manualmente para reintentos
 */
export async function POST(request: NextRequest) {
  console.log('📄 [Invoicing] Webhook recibido en /api/invoicing/process-request');

  try {
    // Verificar que sea una petición interna (opcional, pero recomendado)
    const internalHeader = request.headers.get('X-Internal-Request');
    if (!internalHeader && process.env.NODE_ENV === 'production') {
      console.warn('[Invoicing] Petición sin header X-Internal-Request en producción');
      // No bloquear, pero loguear
    }

    // Parsear body
    const body = await request.json();
    const { request_id, order_id, invoice_id } = body;

    if (!request_id) {
      return NextResponse.json(
        { error: 'request_id es requerido' },
        { status: 400 }
      );
    }

    console.log('[Invoicing] Procesando solicitud:', {
      request_id,
      order_id,
      invoice_id,
    });

    // Procesar solicitud
    const success = await processDocumentRequest(request_id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Documento emitido exitosamente',
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
    console.error('[Invoicing] Error en webhook:', {
      error: error.message,
      stack: error.stack,
    });

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
 * Endpoint para procesar solicitudes pendientes manualmente (útil para cron jobs)
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  console.log('[Invoicing] Procesando solicitudes pendientes:', { limit });

  try {
    // Obtener solicitudes pendientes
    const { data: requests, error } = await supabase.rpc('get_pending_requests', {
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Error obteniendo solicitudes: ${error.message}`);
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay solicitudes pendientes',
        processed: 0,
      });
    }

    // Procesar cada solicitud
    const results = await Promise.allSettled(
      requests.map((req: any) => processDocumentRequest(req.id))
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    const failed = results.filter((r) => r.status === 'rejected' || !r.value).length;

    return NextResponse.json({
      success: true,
      message: `Procesadas ${requests.length} solicitudes`,
      processed: requests.length,
      successful,
      failed,
    });
  } catch (error: any) {
    console.error('[Invoicing] Error procesando solicitudes pendientes:', {
      error: error.message,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

