// =====================================================
// API Route: Get Media Signed URL
// Description: Genera URL firmada para descargar archivos de verificación
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json({ error: 'path requerido' }, { status: 400 });
    }

    // Generar signed URL con service_role
    const adminClient = createServiceRoleClient();

    const { data: signedUrl, error } = await adminClient.storage
      .from('identity-verifications')
      .createSignedUrl(storagePath, 3600); // 1 hora

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrl.signedUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
