import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceRoleClient();
  
  const results: any = {};
  const orderId = '50a56b84-3139-4cc7-bdf3-261f3a0bd1dd';

  // Check the new order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  results.order = {
    data: order,
    error: orderError?.message,
  };

  // Check if there are emission requests for this order (using RPC or direct query)
  // Since we can't query emission_requests directly, let's check documents linked to this order
  const { data: documents, error: docError } = await supabase
    .from('invoicing_documents')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  
  results.documents_for_order = {
    data: documents,
    error: docError?.message,
  };

  // Check all recent documents to see if any new one was created
  const { data: recentDocs, error: recentError } = await supabase
    .from('invoicing_documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  results.recent_documents = {
    data: recentDocs,
    error: recentError?.message,
  };

  return NextResponse.json(results, { status: 200 });
}







