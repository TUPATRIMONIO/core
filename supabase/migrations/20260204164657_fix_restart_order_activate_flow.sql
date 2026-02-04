-- =====================================================
-- Migration: Fix restart_order to activate signing flow
-- Description: Después de reiniciar un pedido, activa automáticamente 
--              el flujo de firma (como lo haría el trigger de pago)
-- Created: 2026-02-04
-- =====================================================

SET search_path TO billing, signing, core, public, extensions;

-- Reemplazar la función restart_order con la lógica de activación del flujo
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
  v_has_signers BOOLEAN;
  v_ai_approved BOOLEAN;
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
    v_pending_amount := v_charged_amount;
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
    v_order.status
  );

  -- =====================================================
  -- NUEVO: Activar el flujo de firma automáticamente
  -- (Replica la lógica de on_signing_order_paid)
  -- =====================================================

  -- Solo activar si la orden está pagada o completada
  IF v_order.status IN ('paid', 'completed') THEN
    -- Refrescar el registro del documento después del reset
    SELECT * INTO v_doc FROM signing.documents WHERE id = v_doc.id;

    -- Validar que el documento tenga firmantes
    SELECT EXISTS (
      SELECT 1 FROM signing.signers s
      WHERE s.document_id = v_doc.id
        AND s.status != 'removed'
      LIMIT 1
    ) INTO v_has_signers;

    IF v_has_signers THEN
      -- Si requiere IA, verificar si ya hay revisión interna aprobada
      IF v_doc.requires_ai_review THEN
        SELECT EXISTS (
          SELECT 1
          FROM signing.ai_reviews ar
          WHERE ar.document_id = v_doc.id
            AND ar.review_type = 'internal_document_review'
            AND ar.status = 'approved'
            AND ar.completed_at IS NOT NULL
          LIMIT 1
        ) INTO v_ai_approved;

        IF NOT v_ai_approved THEN
          -- Poner en pending_ai_review
          UPDATE signing.documents
          SET status = 'pending_ai_review',
              updated_at = NOW()
          WHERE id = v_doc.id;
        ELSE
          -- IA ya aprobada, pasar a pending_signature
          UPDATE signing.documents
          SET status = 'pending_signature',
              sent_to_sign_at = COALESCE(sent_to_sign_at, NOW()),
              updated_at = NOW()
          WHERE id = v_doc.id;
        END IF;
      -- Si requiere aprobación humana
      ELSIF v_doc.requires_approval THEN
        UPDATE signing.documents
        SET status = 'pending_review',
            updated_at = NOW()
        WHERE id = v_doc.id;
      ELSE
        -- Caso estándar: enviar a firma directamente
        UPDATE signing.documents
        SET status = 'pending_signature',
            sent_to_sign_at = NOW(),
            updated_at = NOW()
        WHERE id = v_doc.id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'chargedAmount', v_charged_amount,
    'pendingAmount', v_pending_amount,
    'restartCount', v_order.restart_count + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Función restart_order actualizada para activar flujo de firma automáticamente';
END $$;
