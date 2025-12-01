import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/invoicing/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/invoicing/documents/:id
 * Obtiene un documento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticar
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.organizationId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Obtener documento
    const { data: document, error } = await supabase
      .schema('invoicing')
      .from('documents')
      .select(`
        *,
        customers (*),
        document_items (*)
      `)
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    console.error('[GET /api/invoicing/documents/:id] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoicing/documents/:id/void
 * Anula un documento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticar
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.organizationId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verificar que el documento existe y pertenece a la organización
    const { data: document, error: docError } = await supabase
      .schema('invoicing')
      .from('documents')
      .select('id, status, provider')
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    if (document.status === 'voided') {
      return NextResponse.json(
        { error: 'El documento ya está anulado' },
        { status: 400 }
      );
    }

    // Anular documento
    const { error: updateError } = await supabase
      .schema('invoicing')
      .from('documents')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Error anulando documento: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Obtener documento actualizado
    const { data: updatedDocument } = await supabase
      .schema('invoicing')
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .single();

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error: any) {
    console.error('[POST /api/invoicing/documents/:id/void] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

