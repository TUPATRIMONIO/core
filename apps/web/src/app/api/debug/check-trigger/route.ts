import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceRoleClient();
  
  const results: any = {};

  // Check if trigger exists and is active
  const { data: triggerInfo, error: triggerError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        tgname as trigger_name,
        tgenabled as is_enabled,
        pg_get_triggerdef(oid) as trigger_definition
      FROM pg_trigger
      WHERE tgname LIKE '%order_completed%'
      AND tgrelid = 'billing.orders'::regclass
    `
  }).catch(() => ({ data: null, error: 'RPC not available' }));

  results.trigger_info = triggerInfo || { error: triggerError || 'RPC not available' };

  // Check settings for the organization
  const orgId = '00c5b16f-8fea-436f-a23e-0550504ce608'; // From the order we saw
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  results.settings = {
    data: settings,
    error: settingsError?.message,
  };

  // Check if there are any emission_requests for this order
  const orderId = '3e96f36d-f727-4d1c-a66f-f30f9da247e7';
  const { data: requests, error: requestsError } = await supabase
    .from('emission_requests')
    .select('*')
    .eq('request_data->>order_id', orderId);
  
  results.emission_requests_for_order = {
    data: requests,
    error: requestsError?.message,
  };

  return NextResponse.json(results, { status: 200 });
}







