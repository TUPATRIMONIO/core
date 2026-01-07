-- =====================================================
-- Migration: Support for restarting orders
-- Description: Adds fields to orders and a function to reset the signing process
-- Created: 2026-01-07
-- =====================================================

SET search_path TO billing, signing, core, public, extensions;

-- 1. Add fields to billing.orders
ALTER TABLE billing.orders ADD COLUMN IF NOT EXISTS restart_count INTEGER DEFAULT 0;
ALTER TABLE billing.orders ADD COLUMN IF NOT EXISTS last_restart_at TIMESTAMPTZ;
ALTER TABLE billing.orders ADD COLUMN IF NOT EXISTS restart_metadata JSONB DEFAULT '{}';

-- 2. Add 'order_restarted' to order_event_type if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_event_type' AND e.enumlabel = 'order_restarted') THEN
        ALTER TYPE billing.order_event_type ADD VALUE 'order_restarted';
    END IF;
END
$$;

-- 3. Function to restart order process
CREATE OR REPLACE FUNCTION billing.restart_order(
  p_order_id UUID,
  p_charge_signatures BOOLEAN DEFAULT true,
  p_admin_notes TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_doc RECORD;
  v_signed_count INTEGER;
  v_signers_count INTEGER;
  v_charged_amount DECIMAL(10,2) := 0;
  v_pending_amount DECIMAL(10,2) := 0;
  v_result JSONB;
BEGIN
  -- 1. Get order details
  SELECT * INTO v_order FROM billing.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido no encontrado');
  END IF;

  -- 2. Get document details
  SELECT * INTO v_doc FROM signing.documents WHERE order_id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No hay un proceso de firma asociado a este pedido');
  END IF;

  -- 3. Calculate charge if applicable
  v_signers_count := v_doc.signers_count;
  v_signed_count := v_doc.signed_count;

  IF p_charge_signatures AND v_signed_count > 0 AND v_signers_count > 0 THEN
    v_charged_amount := (v_order.amount / v_signers_count) * v_signed_count;
    v_pending_amount := v_charged_amount; -- La diferencia que debe pagar para completar el pedido original
  END IF;

  -- 4. Reset document
  UPDATE signing.documents
  SET 
    status = 'draft',
    signed_count = 0,
    qr_file_path = NULL,
    current_signed_file_path = NULL,
    provider_transaction_code = NULL,
    updated_at = NOW(),
    approved_at = NULL,
    sent_to_sign_at = NULL,
    completed_at = NULL,
    cancelled_at = NULL
  WHERE id = v_doc.id;

  -- 5. Reset signers
  UPDATE signing.signers
  SET 
    status = 'pending',
    signing_token = gen_random_uuid(),
    signed_at = NULL,
    signature_ip = NULL,
    signature_user_agent = NULL,
    rejection_reason = NULL,
    rejected_at = NULL,
    updated_at = NOW()
  WHERE document_id = v_doc.id AND status != 'removed';

  -- 6. Delete AI reviews
  DELETE FROM signing.ai_reviews WHERE document_id = v_doc.id;

  -- 7. Update order restart tracking
  UPDATE billing.orders
  SET 
    restart_count = restart_count + 1,
    last_restart_at = NOW(),
    restart_metadata = jsonb_build_object(
      'last_restart_by', p_performed_by,
      'charged_amount', v_charged_amount,
      'pending_amount', v_pending_amount,
      'signed_count_at_restart', v_signed_count,
      'admin_notes', p_admin_notes
    ),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 8. Log in history
  INSERT INTO billing.order_history (
    order_id,
    event_type,
    event_description,
    event_metadata,
    user_id,
    from_status,
    to_status
  ) VALUES (
    p_order_id,
    'order_restarted',
    CASE 
      WHEN p_charge_signatures THEN 'Pedido reiniciado con cobro de ' || v_charged_amount || ' por firmas realizadas.'
      ELSE 'Pedido reiniciado sin costo (cortesía admin).'
    END,
    jsonb_build_object(
      'charged_amount', v_charged_amount,
      'pending_amount', v_pending_amount,
      'signed_count', v_signed_count,
      'admin_notes', p_admin_notes
    ),
    p_performed_by,
    v_order.status,
    v_order.status -- El estado del pedido no cambia, se mantiene como pagado (aunque requiera pago adicional luego)
  );

  RETURN jsonb_build_object(
    'success', true,
    'chargedAmount', v_charged_amount,
    'pendingAmount', v_pending_amount,
    'restartCount', v_order.restart_count + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

