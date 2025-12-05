import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id') || 'c5fc5986-0001-4f67-b7fa-bdf687c970ec';
  
  const supabase = createServiceRoleClient();
  const results: any = {};

  try {
    // 1. Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, order_number, metadata, payment_id')
      .eq('id', orderId)
      .single();
    
    results.order = { data: order, error: orderError?.message };

    // 2. Buscar emission_requests para esta orden
    const { data: requests, error: reqError } = await supabase
      .from('emission_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Filtrar por order_id en request_data
    const requestsForOrder = requests?.filter(r => r.request_data?.order_id === orderId);
    
    results.emission_requests = { 
      all_recent: requests?.length,
      for_this_order: requestsForOrder,
      error: reqError?.message 
    };

    // 3. Buscar documentos para esta orden
    const { data: documents, error: docError } = await supabase
      .from('invoicing_documents')
      .select('*')
      .eq('order_id', orderId);
    
    results.documents = { data: documents, error: docError?.message };

    // 4. Verificar pago
    if (order?.payment_id) {
      const { data: payment, error: payError } = await supabase
        .from('payments')
        .select('id, status, provider')
        .eq('id', order.payment_id)
        .single();
      
      results.payment = { data: payment, error: payError?.message };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

