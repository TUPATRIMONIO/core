// =====================================================
// API Route: Proxy Veriff Media
// Description: Descarga imágenes de Veriff con autenticación
//              y las devuelve al navegador para preview
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Verificar acceso: platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
    if (!isPlatformAdmin) {
      return new NextResponse('Sin acceso', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('url requerida', { status: 400 });
    }

    // Validar que la URL sea de Veriff
    const allowedDomains = ['veriff.com', 'veriff.me'];
    let urlObj: URL;
    try {
      urlObj = new URL(imageUrl);
    } catch {
      return new NextResponse('URL inválida', { status: 400 });
    }
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.endsWith(domain));

    if (!isAllowed) {
      return new NextResponse('URL no permitida', { status: 400 });
    }

    // Extraer media ID del path: /v1/media/{mediaId}
    const pathMatch = urlObj.pathname.match(/\/v1\/media\/([a-f0-9-]+)/i);
    if (!pathMatch) {
      return new NextResponse('No se pudo extraer media ID de la URL', { status: 400 });
    }
    const mediaId = pathMatch[1];

    // Obtener credenciales de Veriff
    const adminClient = createServiceRoleClient();
    const { data: config } = await adminClient
      .from('identity_verification_provider_configs')
      .select('credentials, secondary_credentials')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!config?.credentials?.api_key || !config?.credentials?.api_secret) {
      return new NextResponse('Sin configuración de Veriff', { status: 500 });
    }

    // Preparar lista de credenciales para intentar
    const credentialsList = [
      { apiKey: config.credentials.api_key, apiSecret: config.credentials.api_secret }
    ];

    if (config.secondary_credentials && Array.isArray(config.secondary_credentials)) {
      for (const cred of config.secondary_credentials) {
        if (cred.api_key && cred.api_secret) {
          credentialsList.push({ apiKey: cred.api_key, apiSecret: cred.api_secret });
        }
      }
    }

    let response: Response | null = null;

    // Intentar descargar con cada set de credenciales
    for (const cred of credentialsList) {
      try {
        // Generar firma HMAC-SHA256 del media ID
        const signature = await generateHmacSignature(mediaId, cred.apiSecret);

        // Descargar imagen desde Veriff con autenticación correcta
        const res = await fetch(imageUrl, {
          headers: {
            'X-AUTH-CLIENT': cred.apiKey,
            'X-HMAC-SIGNATURE': signature,
          },
        });

        if (res.ok) {
          response = res;
          break; // Éxito, salir del loop
        }
      } catch (e) {
        console.error('Error intentando credencial:', e);
      }
    }

    if (!response || !response.ok) {
      console.error(`Error descargando media de Veriff: ${response?.status} ${response?.statusText}`);
      return new NextResponse(`Error descargando imagen: ${response?.status || 500}`, { status: response?.status || 500 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error: any) {
    console.error('Error en proxy-media:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}

// HMAC-SHA256 signature
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
