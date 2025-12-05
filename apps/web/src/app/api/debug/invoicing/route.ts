import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceRoleClient();
  
  const results: any = {};

  // Check emission requests - using view if available
  const { data: requests, error: reqError } = await supabase
    .from('emission_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  results.emission_requests = {
    data: requests,
    error: reqError?.message,
  };

  // Check orders
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .or('id.eq.3e96f36d-f727-4d1c-a66f-f30f9da247e7,order_number.ilike.%3e96f36d%')
    .order('created_at', { ascending: false })
    .limit(3);
  
  results.orders = {
    data: orders,
    error: orderError?.message,
  };

  // Check documents - using invoicing_documents view
  const { data: documents, error: docError } = await supabase
    .from('invoicing_documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  results.documents = {
    data: documents,
    error: docError?.message,
  };

  // Check settings - using emission_config view
  const { data: settings, error: settingsError } = await supabase
    .from('emission_config')
    .select('*')
    .limit(5);
  
  results.settings = {
    data: settings,
    error: settingsError?.message,
  };

  return NextResponse.json(results, { status: 200 });
}

