import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceRoleClient();
  
  const results: any = {};
  const orderId = '50a56b84-3139-4cc7-bdf3-261f3a0bd1dd';
  const orgId = '00c5b16f-8fea-436f-a23e-0550504ce608';

  try {
    // 1. Verificar el país de la organización (afecta el tipo de documento)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, country, tax_id, email')
      .eq('id', orgId)
      .single();
    
    results.organization = {
      data: org,
      error: orgError?.message,
    };

    // 2. Verificar la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    results.order = {
      data: order,
      error: orderError?.message,
    };

    // 3. Intentar llamar al endpoint de procesamiento
    try {
      const processResponse = await fetch('http://localhost:3000/api/invoicing/process-request?process_pending=true', {
        method: 'GET',
      });
      const processResult = await processResponse.json().catch(() => ({ raw: 'Failed to parse JSON' }));
      results.process_pending_result = {
        status: processResponse.status,
        data: processResult,
      };
    } catch (err: any) {
      results.process_pending_result = { error: err.message };
    }

    // 4. Verificar documentos recientes
    const { data: recentDocs, error: docError } = await supabase
      .from('invoicing_documents')
      .select('id, document_number, document_type, status, order_id, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    results.recent_documents = {
      data: recentDocs,
      error: docError?.message,
    };

  } catch (err: any) {
    results.error = err.message;
  }

  return NextResponse.json(results, { status: 200 });
}

// POST: Procesar manualmente una solicitud específica
export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const { request_id, action } = await request.json();
  
  if (action === 'process_single' && request_id) {
    // Importar el processor
    const { processEmissionRequest } = await import('@/lib/invoicing/processor');
    
    try {
      // Obtener detalles de la solicitud antes de procesar
      const { data: emissionRequest } = await supabase
        .from('emission_requests')
        .select('*')
        .eq('id', request_id)
        .single();
      
      // Intentar procesar
      const result = await processEmissionRequest(request_id);
      
      // Obtener estado después de procesar
      const { data: emissionRequestAfter } = await supabase
        .from('emission_requests')
        .select('*')
        .eq('id', request_id)
        .single();
      
      return NextResponse.json({
        success: result,
        before: emissionRequest,
        after: emissionRequestAfter,
      });
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: err.message,
        stack: err.stack,
      }, { status: 500 });
    }
  }

  // Lista las emission_requests pendientes con detalles
  if (action === 'list_pending') {
    const { data: pendingRequests, error } = await supabase
      .from('emission_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);
    
    return NextResponse.json({
      pending_count: pendingRequests?.length || 0,
      requests: pendingRequests,
      error: error?.message,
    });
  }

  // Acción para cambiar document_type de solicitudes pendientes a stripe_invoice
  if (action === 'fix_pending_types') {
    const { data: pendingRequests, error } = await supabase
      .from('emission_requests')
      .select('id, request_data')
      .eq('status', 'pending');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updated = [];
    for (const req of pendingRequests || []) {
      const requestData = req.request_data || {};
      if (requestData.document_type === 'factura_electronica') {
        // Actualizar a stripe_invoice
        const newRequestData = {
          ...requestData,
          document_type: 'stripe_invoice',
        };
        
        const { error: updateError } = await supabase.rpc('update_emission_request_status', {
          p_request_id: req.id,
          p_status: 'pending',
        }).catch(() => ({ error: null }));
        
        // Actualizar request_data directamente usando SQL
        const { error: dataError } = await supabase
          .from('emission_requests')
          .update({ request_data: newRequestData })
          .eq('id', req.id);
        
        if (!dataError) {
          updated.push(req.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated_count: updated.length,
      updated_ids: updated,
    });
  }

  return NextResponse.json({ error: 'Acción no reconocida. Usar action: process_single, list_pending o fix_pending_types' }, { status: 400 });
}

