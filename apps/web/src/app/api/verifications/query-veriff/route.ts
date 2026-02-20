// =====================================================
// API Route: Query Veriff Direct
// Description: Consulta directa a la API de Veriff sin guardar datos
//              Útil para debug, auditorías, o ver datos crudos
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

type DataType = 'all' | 'person' | 'attempts' | 'decision' | 'media';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { veriffSessionId, dataType, organizationId } = body as {
      veriffSessionId: string;
      dataType: DataType;
      organizationId?: string;
    };

    if (!veriffSessionId || !dataType) {
      return NextResponse.json(
        { error: 'veriffSessionId y dataType son requeridos' },
        { status: 400 }
      );
    }

    if (!['all', 'person', 'attempts', 'decision', 'media'].includes(dataType)) {
      return NextResponse.json(
        { error: 'dataType debe ser: all, person, attempts, decision o media' },
        { status: 400 }
      );
    }

    const adminClient = createServiceRoleClient();

    // Verificar acceso: platform admin O miembro de la organización
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');

    if (!isPlatformAdmin) {
      if (organizationId) {
        const { data: membership } = await adminClient
          .from('organization_users')
          .select('id')
          .eq('user_id', user.id)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .single();

        if (!membership) {
          return NextResponse.json({ error: 'Sin acceso a esta organización' }, { status: 403 });
        }
      } else {
        return NextResponse.json(
          { error: 'Solo platform admins pueden consultar sin especificar organización' },
          { status: 403 }
        );
      }
    }

    // Obtener configuración de Veriff de cualquier org activa (solo necesitamos el API key)
    const { data: config } = await adminClient
      .from('identity_verification_provider_configs')
      .select('credentials, secondary_credentials, provider:identity_verification_providers(slug)')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!config || !config.credentials?.api_key) {
      return NextResponse.json(
        { error: 'No se encontró configuración de API de Veriff' },
        { status: 500 }
      );
    }

    // Verificar que sea Veriff
    if (config.provider?.slug !== 'veriff') {
      return NextResponse.json(
        { error: 'Esta función solo soporta Veriff' },
        { status: 400 }
      );
    }

    // Preparar lista de credenciales para probar (primarias + secundarias)
    const allCredentials = [
      { apiKey: config.credentials.api_key, apiSecret: config.credentials.api_secret }
    ];
    if (config.secondary_credentials && Array.isArray(config.secondary_credentials)) {
      for (const cred of config.secondary_credentials) {
        if (cred.api_key && cred.api_secret) {
          allCredentials.push({ apiKey: cred.api_key, apiSecret: cred.api_secret });
        }
      }
    }

    let data: any;
    let success = false;
    let lastError = '';

    // Intentar con cada set de credenciales
    for (const cred of allCredentials) {
      if (!cred.apiSecret) continue;

      // Generar firma SHA256(sessionId + apiSecret)
      const signature = await generateVeriffSignature(veriffSessionId, cred.apiSecret);

      const headers = {
        'X-AUTH-CLIENT': cred.apiKey,
        'X-SIGNATURE': signature,
        'Content-Type': 'application/json',
      };

      if (dataType === 'all') {
        // Consultar los 4 endpoints disponibles en paralelo
        const [personRes, attemptsRes, decisionRes, mediaRes] = await Promise.all([
          fetchVeriffEndpoint(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/person`, headers),
          fetchVeriffEndpoint(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/attempts`, headers),
          fetchVeriffEndpoint(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/decision`, headers),
          fetchVeriffEndpoint(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/media`, headers),
        ]);

        // Verificar si al menos uno retornó éxito (no error)
        if (!personRes.error || !attemptsRes.error || !decisionRes.error || !mediaRes.error) {
          data = {
            person: personRes,
            attempts: attemptsRes,
            decision: decisionRes,
            media: mediaRes,
          };
          success = true;
          break;
        } else {
            lastError = personRes.error || attemptsRes.error || decisionRes.error || mediaRes.error;
        }

      } else {
        // Consultar un endpoint individual
        const endpointMap: Record<string, string> = {
          person: `${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/person`,
          attempts: `${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/attempts`,
          decision: `${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/decision`,
          media: `${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/media`,
        };

        const url = endpointMap[dataType];
        const response = await fetch(url, { method: 'GET', headers });

        if (response.ok) {
          data = await response.json();
          success = true;
          break;
        } else {
          lastError = `HTTP ${response.status}`;
          // Si es 404 o 403, probablemente credenciales incorrectas, seguimos probando
          if (response.status !== 404 && response.status !== 403) {
             const errorText = await response.text();
             console.error(`Error consultando Veriff ${dataType}:`, response.status, errorText);
          }
        }
      }
    }

    if (!success) {
       return NextResponse.json(
          {
            error: 'No se pudo obtener datos de Veriff con ninguna credencial configurada',
            details: lastError,
          },
          { status: 404 } // Asumimos 404 si no se encontró con ninguna credencial
        );
    }

    // Registrar consulta en audit log (si tenemos session local)
    const { data: localSession } = await adminClient
      .from('identity_verification_sessions')
      .select('id, organization_id')
      .eq('provider_session_id', veriffSessionId)
      .single();

    if (localSession) {
      await adminClient.from('identity_verification_audit_log').insert({
        session_id: localSession.id,
        event_type: 'veriff_api_queried',
        event_data: {
          user_id: user.id,
          data_type: dataType,
          queried_at: new Date().toISOString(),
        },
        actor_type: 'user',
        actor_id: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      veriffSessionId,
      dataType,
      data,
      queriedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en query-veriff:', error);
    return NextResponse.json(
      { error: 'Error al consultar Veriff', details: error.message },
      { status: 500 }
    );
  }
}

async function fetchVeriffEndpoint(url: string, headers: Record<string, string>): Promise<any> {
  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      // No loguear error si estamos probando credenciales
      return { error: `HTTP ${response.status}`, status: response.status };
    }
    return await response.json();
  } catch (error: any) {
    console.error(`Error en fetchVeriffEndpoint ${url}:`, error);
    return { error: error.message };
  }
}

async function generateVeriffSignature(sessionId: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId + apiSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
