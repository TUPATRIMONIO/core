import { createServiceRoleClient } from '@/lib/supabase/server';

export async function recordDiscountUsage(orderId: string, supabaseClient?: any) {
  const supabase = supabaseClient || createServiceRoleClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, organization_id, discount_code_id, discount_amount, currency, created_by_user_id')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.warn('[recordDiscountUsage] Orden no encontrada:', orderError?.message);
    return;
  }

  const discountAmount = Number(order.discount_amount || 0);
  if (!order.discount_code_id || discountAmount <= 0) {
    return;
  }

  const { data: existingUsage } = await supabase
    .from('discount_usage')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existingUsage) {
    return;
  }

  let { error: insertError } = await supabase
    .from('discount_usage')
    .insert({
      discount_code_id: order.discount_code_id,
      order_id: orderId,
      organization_id: order.organization_id,
      user_id: order.created_by_user_id || null,
      discount_amount: discountAmount,
      currency: order.currency,
    });

  if (insertError && supabaseClient) {
    const serviceSupabase = createServiceRoleClient();
    const { error: retryError } = await serviceSupabase
      .from('discount_usage')
      .insert({
        discount_code_id: order.discount_code_id,
        order_id: orderId,
        organization_id: order.organization_id,
        user_id: order.created_by_user_id || null,
        discount_amount: discountAmount,
        currency: order.currency,
      });

    insertError = retryError || null;
  }

  if (insertError) {
    console.error('[recordDiscountUsage] Error insertando uso:', insertError);
    return;
  }

  let { data: codeData, error: codeError } = await supabase
    .from('discount_codes')
    .select('current_uses')
    .eq('id', order.discount_code_id)
    .single();

  if (codeError && supabaseClient) {
    const serviceSupabase = createServiceRoleClient();
    const { data: retryData, error: retryError } = await serviceSupabase
      .from('discount_codes')
      .select('current_uses')
      .eq('id', order.discount_code_id)
      .single();
    codeData = retryData || null;
    codeError = retryError || null;
  }

  const nextUses = Number(codeData?.current_uses || 0) + 1;

  let { error: updateError } = await supabase
    .from('discount_codes')
    .update({
      current_uses: nextUses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.discount_code_id);

  if (updateError && supabaseClient) {
    const serviceSupabase = createServiceRoleClient();
    const { error: retryError } = await serviceSupabase
      .from('discount_codes')
      .update({
        current_uses: nextUses,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.discount_code_id);
    updateError = retryError || null;
  }

  if (updateError) {
    console.error('[recordDiscountUsage] Error actualizando contador:', updateError);
  }
}

