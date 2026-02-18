// =====================================================
// API Route: Veriff Webhook
// Description: Recibe eventos de Veriff y los encola para procesamiento
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { processVeriffSession } from '@/lib/veriff/process-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    // Obtener firma del header
    const signature = request.headers.get('x-hmac-signature');
    const authClient = request.headers.get('x-auth-client');

    if (!signature || !authClient) {
      console.error('Webhook sin headers de autenticación');
      return NextResponse.json({ error: 'Missing authentication headers' }, { status: 401 });
    }

    // Verificar firma HMAC
    const adminClient = createServiceRoleClient();
    const { data: config } = await adminClient
      .from('identity_verification_provider_configs')
      .select('id, provider_id, credentials, organization_id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!config?.credentials?.api_secret) {
      console.error('No se encontró configuración de Veriff');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const expectedSignature = await generateHmacSignature(body, config.credentials.api_secret);
    if (signature !== expectedSignature) {
      console.error('Firma inválida en webhook de Veriff');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extraer datos del evento
    const {
      id: veriffSessionId,
      feature,
      action,
      vendorData,
    } = payload;

    if (!veriffSessionId) {
      console.error('Webhook sin session ID:', payload);
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    const eventType = `${feature}.${action}`;

    // Guardar en cola de sincronización (upsert para manejar reintentos o nuevos eventos)
    const { data: queuedItem, error: upsertError } = await adminClient
      .from('pending_veriff_syncs')
      .upsert({
        veriff_session_id: veriffSessionId,
        event_type: eventType,
        event_payload: payload,
        status: 'pending',
        error_message: null,
        processed_at: null,
        retry_count: 0
      }, { onConflict: 'veriff_session_id' })
      .select()
      .single();

    if (upsertError) {
      console.error('Error guardando webhook:', upsertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log(`Webhook recibido y encolado: ${eventType} para session ${veriffSessionId}`);

    // Intentar procesar inmediatamente
    // No esperamos el resultado para no bloquear el webhook response demasiado tiempo,
    // pero idealmente deberíamos esperar un poco o lanzar en background.
    // Vercel functions tienen límite de tiempo, así que mejor esperar y responder.
    try {
      const result = await processVeriffSession(
        veriffSessionId,
        {
          apiKey: config.credentials.api_key,
          apiSecret: config.credentials.api_secret,
          organizationId: config.organization_id,
          providerId: config.provider_id,
          providerConfigId: config.id,
        },
        eventType
      );

      if (result.success) {
        // Marcar como procesado en la cola
        await adminClient
          .from('pending_veriff_syncs')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', queuedItem.id);
        
        console.log(`✅ Procesamiento inmediato exitoso para ${veriffSessionId}`);
      } else {
        console.warn(`⚠️ Procesamiento inmediato falló para ${veriffSessionId}, quedará para el cron: ${result.error}`);
        // Opcional: actualizar error_message en la cola
        await adminClient
          .from('pending_veriff_syncs')
          .update({ 
            error_message: result.error,
            // No cambiamos status a failed para que el cron lo intente de nuevo si es necesario,
            // aunque el cron busca 'pending'. Si falló aquí, quizás es transitorio.
          })
          .eq('id', queuedItem.id);
      }
    } catch (processError: any) {
      console.error(`❌ Error crítico en procesamiento inmediato de ${veriffSessionId}:`, processError);
      // Actualizar error en la cola
      await adminClient
          .from('pending_veriff_syncs')
          .update({ 
            error_message: processError.message || 'Unknown error',
          })
          .eq('id', queuedItem.id);
    }

    return NextResponse.json({ 
      message: 'Webhook received and processed',
      sessionId: veriffSessionId,
      eventType,
    });
  } catch (error: any) {
    console.error('Error procesando webhook de Veriff:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
