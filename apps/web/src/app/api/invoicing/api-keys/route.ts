import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/invoicing/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createApiKey, hashApiKey } from '@/lib/invoicing/api-keys';

export const runtime = 'nodejs';

/**
 * POST /api/invoicing/api-keys
 * Crea una nueva API Key
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar (solo usuarios, no API keys)
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.organizationId || auth.authType !== 'user') {
      return NextResponse.json(
        { error: 'No autenticado o no autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions, expires_at } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name es requerido' },
        { status: 400 }
      );
    }

    // Crear API key
    const expiresAt = expires_at ? new Date(expires_at) : undefined;
    const { key, id } = await createApiKey(
      auth.organizationId,
      name,
      permissions,
      expiresAt
    );

    // IMPORTANTE: Retornar la key solo una vez (nunca más se podrá ver)
    return NextResponse.json({
      success: true,
      api_key: {
        id,
        key, // Solo se muestra una vez
        name,
        expires_at: expires_at || null,
      },
      warning: 'Guarda esta key de forma segura. No se mostrará nuevamente.',
    });
  } catch (error: any) {
    console.error('[POST /api/invoicing/api-keys] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoicing/api-keys
 * Lista API Keys de la organización (sin mostrar las keys)
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticar (solo usuarios)
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.organizationId || auth.authType !== 'user') {
      return NextResponse.json(
        { error: 'No autenticado o no autorizado' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Obtener API keys (sin hash)
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, permissions, rate_limit_per_minute, expires_at, last_used_at, usage_count, is_active, created_at')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Error obteniendo API keys: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      api_keys: apiKeys || [],
    });
  } catch (error: any) {
    console.error('[GET /api/invoicing/api-keys] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

