import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/billing/pdf-generator';

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
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }
    
    // Obtener factura con line items (usar vista pública)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items (*)
      `)
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();
    
    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }
    
    // Obtener información de la organización
    const { data: org } = await supabase
      .from('organizations')
      .select('name, email, address, tax_id')
      .eq('id', orgUser.organization_id)
      .single();
    
    if (!org) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }
    
    // Generar PDF
    const pdfBuffer = await generateInvoicePDF(invoice, org);
    
    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${invoice.invoice_number}.pdf"`,
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

