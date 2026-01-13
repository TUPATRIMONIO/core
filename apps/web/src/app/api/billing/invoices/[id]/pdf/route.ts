import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/billing/pdf-generator';
import { getActiveOrganizationId } from '@/lib/organization/get-active-org';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener organización del usuario
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);
    
    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'Organización no encontrada' },
        { status: 400 }
      );
    }
    
    // Obtener documento tributario (invoicing.documents)
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();
    
    if (docError || !document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }
    
    // Si tiene PDF URL externo, redirigir a él
    if (document.pdf_url) {
      return NextResponse.redirect(document.pdf_url);
    }
    
    // Obtener items del documento
    const { data: items } = await supabase
      .from('document_items')
      .select('*')
      .eq('document_id', id);
    
    // Obtener información de la organización
    const { data: org } = await supabase
      .from('organizations')
      .select('name, email, address, tax_id')
      .eq('id', organizationId)
      .single();
    
    if (!org) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }
    
    // Transformar documento al formato esperado por generateInvoicePDF
    const invoice = {
      invoice_number: document.document_number,
      status: document.status,
      type: document.document_type,
      subtotal: document.subtotal,
      tax: document.tax,
      total: document.total,
      currency: document.currency,
      created_at: document.created_at,
      line_items: items || [],
    };
    
    // Generar PDF
    const pdfBuffer = await generateInvoicePDF(invoice, org);
    
    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="documento-${document.document_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Error generando PDF' },
      { status: 500 }
    );
  }
}
