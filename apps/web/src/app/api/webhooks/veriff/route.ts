// =====================================================
// API Route: Veriff Webhook
// Description: Recibe eventos de Veriff y los encola para procesamiento
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

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
      .select('credentials')
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

    // Guardar en cola de sincronización
    const { error: insertError } = await adminClient
      .from('pending_veriff_syncs')
      .insert({
        veriff_session_id: veriffSessionId,
        event_type: eventType,
        event_payload: payload,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      // Si ya existe (UNIQUE constraint), ignorar
      if (insertError.code === '23505') {
        console.log(`Session ${veriffSessionId} ya está en la cola`);
        return NextResponse.json({ message: 'Already queued' });
      }
      
      console.error('Error guardando webhook:', insertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log(`Webhook recibido: ${eventType} para session ${veriffSessionId}`);

    return NextResponse.json({ 
      message: 'Webhook received',
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
