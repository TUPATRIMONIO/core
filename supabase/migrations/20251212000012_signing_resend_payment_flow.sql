-- =====================================================
-- Migration: Resend payment flow (invalidate signed signatures)
-- Description: Permite rehacer un documento y cobrar firmas ya realizadas
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, billing, core, public, extensions;

-- =====================================================
-- RPC: begin_document_resend
-- - Invalida firmas (resetea firmantes a pending y renueva tokens)
-- - Pone el documento en draft y limpia order_id para forzar pago
-- - Guarda contador en metadata.resend.invalidated_signatures_count
-- =====================================================

CREATE OR REPLACE FUNCTION public.begin_document_resend(
  p_document_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
  v_signed_count INTEGER;
  v_now TIMESTAMPTZ := NOW();
  v_signer RECORD;
BEGIN
  PERFORM set_config('search_path', 'signing,billing,core,public,extensions', true);

  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF NOT signing.user_belongs_to_org(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF v_doc.status NOT IN ('pending_signature', 'partially_signed') THEN
    RAISE EXCEPTION 'Document cannot be resent from status: %', v_doc.status;
  END IF;

  SELECT COUNT(*) INTO v_signed_count
  FROM signing.signers
  WHERE document_id = p_document_id
    AND status = 'signed';

  IF v_signed_count <= 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'No hay firmas que invalidar',
      'invalidated_signatures_count', 0
    );
  END IF;

  -- Registrar snapshot de firmantes firmados antes de invalidar
  FOR v_signer IN (
    SELECT * FROM signing.signers
    WHERE document_id = p_document_id
      AND status = 'signed'
  ) LOOP
    INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by, reason)
    VALUES (
      p_document_id,
      v_signer.id,
      'modified',
      to_jsonb(v_signer),
      auth.uid(),
      'Firma invalidada por re-envío voluntario'
    );
  END LOOP;

  -- Resetear firmantes (manteniendo filas, pero reiniciando estado y token)
  UPDATE signing.signers
  SET status = 'pending',
      signed_at = NULL,
      signature_ip = NULL,
      signature_user_agent = NULL,
      rejection_reason = NULL,
      rejected_at = NULL,
      signing_token = gen_random_uuid(),
      token_expires_at = (NOW() + INTERVAL '7 days'),
      updated_at = NOW()
  WHERE document_id = p_document_id
    AND status != 'removed';

  -- Dejar documento en draft y sin order_id (para forzar nuevo pago)
  UPDATE signing.documents
  SET status = 'draft',
      order_id = NULL,
      sent_to_sign_at = NULL,
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{resend}',
        jsonb_build_object(
          'active', true,
          'invalidated_signatures_count', v_signed_count,
          'started_at', v_now
        ),
        true
      ),
      updated_at = NOW()
  WHERE id = p_document_id;

  RETURN jsonb_build_object(
    'success', true,
    'invalidated_signatures_count', v_signed_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_document_resend(UUID) TO authenticated;

-- =====================================================
-- RPC: calculate_resend_cost
-- - Usa metadata.resend.invalidated_signatures_count si existe
-- - Precio unitario desde metadata.signature_product o signing.products
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_resend_cost(
  p_document_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
  v_invalidated_count INTEGER;
  v_sig JSONB;
  v_product_id UUID;
  v_unit_price NUMERIC;
  v_currency TEXT;
  v_billing_unit TEXT;
  v_total NUMERIC;
BEGIN
  PERFORM set_config('search_path', 'signing,billing,core,public,extensions', true);

  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF NOT signing.user_belongs_to_org(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_invalidated_count := COALESCE((v_doc.metadata->'resend'->>'invalidated_signatures_count')::int, 0);

  v_sig := v_doc.metadata->'signature_product';
  v_product_id := NULLIF((v_sig->>'id')::text, '')::uuid;

  v_unit_price := COALESCE(
    NULLIF((v_sig->>'unit_price')::text, '')::numeric,
    NULLIF((v_sig->>'base_price')::text, '')::numeric,
    (SELECT p.base_price FROM signing.products p WHERE p.id = v_product_id)
  );

  v_currency := COALESCE(
    NULLIF(v_sig->>'currency', ''),
    (SELECT p.currency FROM signing.products p WHERE p.id = v_product_id),
    'CLP'
  );

  v_billing_unit := COALESCE(
    NULLIF(v_sig->>'billing_unit', ''),
    (SELECT p.billing_unit FROM signing.products p WHERE p.id = v_product_id),
    'per_signer'
  );

  IF v_invalidated_count <= 0 OR v_unit_price IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'invalidated_signatures_count', v_invalidated_count,
      'unit_price', COALESCE(v_unit_price, 0),
      'currency', v_currency,
      'total', 0
    );
  END IF;

  IF v_billing_unit = 'per_document' THEN
    v_total := v_unit_price;
  ELSE
    v_total := v_unit_price * v_invalidated_count;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'invalidated_signatures_count', v_invalidated_count,
    'unit_price', v_unit_price,
    'currency', v_currency,
    'billing_unit', v_billing_unit,
    'total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_resend_cost(UUID) TO authenticated;

-- =====================================================
-- Patch: send_document_to_sign - exigir pago (excepto platform admins)
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_document_to_sign(
  p_document_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_doc RECORD;
  v_signer_count INTEGER;
  v_is_platform_admin BOOLEAN;
BEGIN
  -- Obtener documento con bloqueo
  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF NOT signing.user_belongs_to_org(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Enforce payment for non-platform admins
  SELECT COALESCE(public.is_platform_admin(), false) INTO v_is_platform_admin;

  IF NOT v_is_platform_admin THEN
    IF v_doc.order_id IS NULL THEN
      RAISE EXCEPTION 'Payment required before sending to sign';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM billing.orders o
      WHERE o.id = v_doc.order_id
        AND o.status IN ('paid', 'completed')
    ) THEN
      RAISE EXCEPTION 'Payment required before sending to sign';
    END IF;
  END IF;

  -- Verificar estado válido
  IF v_doc.status NOT IN ('draft', 'approved') THEN
    RAISE EXCEPTION 'Document cannot be sent to sign from status: %', v_doc.status;
  END IF;

  -- Verificar que hay firmantes
  SELECT COUNT(*) INTO v_signer_count
  FROM signing.signers
  WHERE document_id = p_document_id
    AND status != 'removed';

  IF v_signer_count = 0 THEN
    RAISE EXCEPTION 'Document must have at least one signer';
  END IF;

  -- Verificar si requiere revisión de IA
  IF v_doc.requires_ai_review THEN
    UPDATE signing.documents
    SET status = 'pending_ai_review',
        updated_at = NOW()
    WHERE id = p_document_id;

    RETURN jsonb_build_object('success', true, 'status', 'pending_ai_review', 'message', 'Document sent to AI review');
  END IF;

  -- Enviar a firma
  UPDATE signing.documents
  SET status = 'pending_signature',
      sent_to_sign_at = NOW(),
      updated_at = NOW()
  WHERE id = p_document_id;

  RETURN jsonb_build_object('success', true, 'status', 'pending_signature', 'message', 'Document sent to signers');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.send_document_to_sign(UUID) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Resend flow + payment enforcement actualizado';
END $$;

