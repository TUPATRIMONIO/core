// =====================================================
// API Route: Trigger Verification Process
// Description: Endpoint público para activar el procesamiento de una verificación
//              desde sistemas externos (M2M) solo con el sessionId.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { processVeriffSession } from '@/lib/veriff/process-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
    }

    const adminClient = createServiceRoleClient();

    // Obtener configuración activa de Veriff
    const { data: config } = await adminClient
      .from('identity_verification_provider_configs')
      .select('id, provider_id, credentials, organization_id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!config?.credentials?.api_key || !config?.credentials?.api_secret) {
      return NextResponse.json({ 
        error: 'No se encontró configuración activa de Veriff' 
      }, { status: 500 });
    }

    console.log(`🚀 Trigger externo recibido para sesión ${sessionId}`);

    const result = await processVeriffSession(
      sessionId,
      {
        apiKey: config.credentials.api_key,
        apiSecret: config.credentials.api_secret,
        organizationId: config.organization_id,
        providerId: config.provider_id,
        providerConfigId: config.id,
      },
      'external_trigger'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.status,
        isNew: result.isNew,
        sessionId: sessionId,
        message: 'Verificación procesada exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 }); // 400 porque probablemente no se encontró en Veriff
    }

  } catch (error: any) {
    console.error('Error en trigger verification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
