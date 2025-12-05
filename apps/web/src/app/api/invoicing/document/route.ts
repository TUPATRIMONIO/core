import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
  }

  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Obtener el documento de la orden
  const { data: document, error } = await supabase
    .from('invoicing_documents')
    .select('id, document_number, document_type, pdf_url, xml_url, status, external_id, created_at')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    console.error('[GET /api/invoicing/document] Error:', error);
    return NextResponse.json({ error: 'Error obteniendo documento' }, { status: 500 });
  }

  return NextResponse.json({ document });
}

