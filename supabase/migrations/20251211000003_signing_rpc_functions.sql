-- =====================================================
-- Migration: Signing RPC functions
-- Description: Public RPC functions for signing operations
-- Created: 2025-12-11
-- =====================================================

SET search_path TO signing, core, billing, public, extensions;

-- =====================================================
-- FUNCTION: Generate QR Identifier
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_qr_identifier()
RETURNS TEXT AS $$
DECLARE
  v_identifier TEXT;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generar identificador único
    v_identifier := 'DOC-' || 
      UPPER(ENCODE(gen_random_bytes(4), 'hex')) || '-' ||
      UPPER(ENCODE(gen_random_bytes(4), 'hex'));
    
    -- Verificar que no existe
    IF NOT EXISTS (SELECT 1 FROM signing.documents WHERE qr_identifier = v_identifier) THEN
      RETURN v_identifier;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique QR identifier';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_qr_identifier() TO authenticated;

-- =====================================================
-- FUNCTION: Create Document
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_signing_document(
  p_organization_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_signing_order signing.signing_order_type DEFAULT 'simultaneous',
  p_notary_service signing.notary_service_type DEFAULT 'none',
  p_requires_approval BOOLEAN DEFAULT false,
  p_requires_ai_review BOOLEAN DEFAULT true,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_document_id UUID;
  v_qr_identifier TEXT;
  v_result JSONB;
BEGIN
  -- Verificar que el usuario pertenece a la organización
  IF NOT signing.user_belongs_to_org(p_organization_id) THEN
    RAISE EXCEPTION 'User does not belong to organization';
  END IF;
  
  -- Generar identificador QR
  v_qr_identifier := public.generate_qr_identifier();
  
  -- Crear documento
  INSERT INTO signing.documents (
    organization_id,
    title,
    description,
    signing_order,
    notary_service,
    requires_approval,
    requires_ai_review,
    order_id,
    qr_identifier,
    created_by,
    manager_id
  ) VALUES (
    p_organization_id,
    p_title,
    p_description,
    p_signing_order,
    p_notary_service,
    p_requires_approval,
    p_requires_ai_review,
    p_order_id,
    v_qr_identifier,
    auth.uid(),
    auth.uid()
  )
  RETURNING id INTO v_document_id;
  
  -- Retornar documento creado
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'status', status,
    'qr_identifier', qr_identifier,
    'created_at', created_at
  ) INTO v_result
  FROM signing.documents
  WHERE id = v_document_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_signing_document(UUID, TEXT, TEXT, signing.signing_order_type, signing.notary_service_type, BOOLEAN, BOOLEAN, UUID) TO authenticated;

-- =====================================================
-- FUNCTION: Add Signer to Document
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_document_signer(
  p_document_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_rut TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_is_foreigner BOOLEAN DEFAULT false,
  p_signing_order INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_signer_id UUID;
  v_doc RECORD;
  v_result JSONB;
BEGIN
  -- Obtener documento y verificar acceso
  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  IF NOT signing.user_belongs_to_org(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- No permitir agregar firmantes si ya está completamente firmado
  IF v_doc.status IN ('signed', 'completed', 'cancelled', 'rejected') THEN
    RAISE EXCEPTION 'Cannot add signers to document in status: %', v_doc.status;
  END IF;
  
  -- Crear firmante
  INSERT INTO signing.signers (
    document_id,
    user_id,
    email,
    full_name,
    rut,
    phone,
    is_foreigner,
    signing_order
  ) VALUES (
    p_document_id,
    p_user_id,
    LOWER(TRIM(p_email)),
    TRIM(p_full_name),
    p_rut,
    p_phone,
    p_is_foreigner,
    p_signing_order
  )
  ON CONFLICT (document_id, email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    rut = EXCLUDED.rut,
    phone = EXCLUDED.phone,
    is_foreigner = EXCLUDED.is_foreigner,
    signing_order = EXCLUDED.signing_order,
    updated_at = NOW()
  RETURNING id INTO v_signer_id;
  
  -- Retornar firmante
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'full_name', full_name,
    'status', status,
    'signing_token', signing_token
  ) INTO v_result
  FROM signing.signers
  WHERE id = v_signer_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_document_signer(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, UUID) TO authenticated;

-- =====================================================
-- FUNCTION: Remove Signer from Document
-- =====================================================

CREATE OR REPLACE FUNCTION public.remove_document_signer(
  p_signer_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_signer RECORD;
  v_doc RECORD;
BEGIN
  -- Obtener firmante
  SELECT * INTO v_signer
  FROM signing.signers
  WHERE id = p_signer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Signer not found';
  END IF;
  
  -- Obtener documento
  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = v_signer.document_id;
  
  IF NOT signing.user_belongs_to_org(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- No permitir remover si ya firmó
  IF v_signer.status = 'signed' THEN
    RAISE EXCEPTION 'Cannot remove signer who has already signed';
  END IF;
  
  -- Marcar como removido (no eliminar para mantener historial)
  UPDATE signing.signers
  SET status = 'removed',
      updated_at = NOW()
  WHERE id = p_signer_id;
  
  -- Registrar razón en historial
  INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by, reason)
  VALUES (v_signer.document_id, p_signer_id, 'removed', to_jsonb(v_signer), auth.uid(), p_reason);
  
  RETURN jsonb_build_object('success', true, 'message', 'Signer removed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.remove_document_signer(UUID, TEXT) TO authenticated;

-- =====================================================
-- FUNCTION: Submit Document for Review
-- =====================================================

CREATE OR REPLACE FUNCTION public.submit_document_for_review(
  p_document_id UUID,
  p_reviewer_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_doc RECORD;
  v_reviewer_id UUID;
BEGIN
  -- Obtener documento
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
  
  IF v_doc.status != 'draft' THEN
    RAISE EXCEPTION 'Document must be in draft status';
  END IF;
  
  -- Agregar revisores
  FOREACH v_reviewer_id IN ARRAY p_reviewer_ids
  LOOP
    INSERT INTO signing.reviewers (document_id, user_id)
    VALUES (p_document_id, v_reviewer_id)
    ON CONFLICT (document_id, user_id) DO NOTHING;
  END LOOP;
  
  -- Actualizar estado
  UPDATE signing.documents
  SET status = 'pending_review',
      updated_at = NOW()
  WHERE id = p_document_id;
  
  RETURN jsonb_build_object('success', true, 'status', 'pending_review');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_document_for_review(UUID, UUID[]) TO authenticated;

-- =====================================================
-- FUNCTION: Approve Document Review
-- =====================================================

CREATE OR REPLACE FUNCTION public.approve_document_review(
  p_document_id UUID,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_doc RECORD;
  v_all_approved BOOLEAN;
BEGIN
  -- Obtener documento
  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  IF v_doc.status != 'pending_review' THEN
    RAISE EXCEPTION 'Document is not pending review';
  END IF;
  
  -- Marcar revisión como aprobada
  UPDATE signing.reviewers
  SET status = 'approved',
      review_comment = p_comment,
      reviewed_at = NOW()
  WHERE document_id = p_document_id
    AND user_id = auth.uid();
  
  -- Verificar si todos aprobaron
  SELECT NOT EXISTS (
    SELECT 1 FROM signing.reviewers
    WHERE document_id = p_document_id
      AND status != 'approved'
  ) INTO v_all_approved;
  
  -- Si todos aprobaron, cambiar estado
  IF v_all_approved OR NOT v_doc.all_reviewers_must_approve THEN
    UPDATE signing.documents
    SET status = 'approved',
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_document_id;
    
    RETURN jsonb_build_object('success', true, 'all_approved', true, 'status', 'approved');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'all_approved', false, 'status', 'pending_review');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_document_review(UUID, TEXT) TO authenticated;

-- =====================================================
-- FUNCTION: Send Document to Sign
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_document_to_sign(
  p_document_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_doc RECORD;
  v_signer_count INTEGER;
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

-- =====================================================
-- FUNCTION: Get Document for Signing (by token)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_document_for_signing(
  p_signing_token UUID
)
RETURNS JSONB AS $$
DECLARE
  v_signer RECORD;
  v_doc RECORD;
  v_result JSONB;
BEGIN
  -- Obtener firmante por token
  SELECT * INTO v_signer
  FROM signing.signers
  WHERE signing_token = p_signing_token
    AND status NOT IN ('signed', 'removed', 'expired');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired signing token';
  END IF;
  
  -- Verificar expiración del token
  IF v_signer.token_expires_at < NOW() THEN
    UPDATE signing.signers
    SET status = 'expired'
    WHERE id = v_signer.id;
    
    RAISE EXCEPTION 'Signing token has expired';
  END IF;
  
  -- Obtener documento
  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = v_signer.document_id;
  
  -- Verificar estado del documento
  IF v_doc.status NOT IN ('pending_signature', 'partially_signed') THEN
    RAISE EXCEPTION 'Document is not available for signing';
  END IF;
  
  -- Construir respuesta
  v_result := jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id,
      'title', v_doc.title,
      'qr_identifier', v_doc.qr_identifier,
      'file_path', COALESCE(v_doc.qr_file_path, v_doc.original_file_path),
      'signing_order', v_doc.signing_order
    ),
    'signer', jsonb_build_object(
      'id', v_signer.id,
      'email', v_signer.email,
      'full_name', v_signer.full_name,
      'rut', v_signer.rut,
      'status', v_signer.status,
      'fea_vigente', v_signer.fea_vigente,
      'certificate_blocked', v_signer.certificate_blocked
    ),
    'all_signers', (
      SELECT jsonb_agg(jsonb_build_object(
        'full_name', s.full_name,
        'status', s.status,
        'signing_order', s.signing_order
      ) ORDER BY s.signing_order)
      FROM signing.signers s
      WHERE s.document_id = v_doc.id
        AND s.status != 'removed'
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Esta función puede ser llamada sin autenticación (por el token)
GRANT EXECUTE ON FUNCTION public.get_document_for_signing(UUID) TO anon, authenticated;

-- =====================================================
-- FUNCTION: Record Signature
-- =====================================================

CREATE OR REPLACE FUNCTION public.record_signature(
  p_signing_token UUID,
  p_signature_ip INET DEFAULT NULL,
  p_signature_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_signer RECORD;
  v_doc RECORD;
BEGIN
  -- Obtener firmante con bloqueo
  SELECT * INTO v_signer
  FROM signing.signers
  WHERE signing_token = p_signing_token
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid signing token';
  END IF;
  
  IF v_signer.status = 'signed' THEN
    RAISE EXCEPTION 'Already signed';
  END IF;
  
  IF v_signer.status = 'removed' THEN
    RAISE EXCEPTION 'Signer was removed';
  END IF;
  
  -- Actualizar firmante
  UPDATE signing.signers
  SET status = 'signed',
      signed_at = NOW(),
      signature_ip = p_signature_ip,
      signature_user_agent = p_signature_user_agent,
      updated_at = NOW()
  WHERE id = v_signer.id;
  
  -- El trigger check_all_signed se encargará de actualizar el documento
  
  RETURN jsonb_build_object('success', true, 'signed_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_signature(UUID, INET, TEXT) TO anon, authenticated;

-- =====================================================
-- FUNCTION: Reject Signature
-- =====================================================

CREATE OR REPLACE FUNCTION public.reject_signature(
  p_signing_token UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_signer RECORD;
  v_doc RECORD;
BEGIN
  -- Obtener firmante
  SELECT * INTO v_signer
  FROM signing.signers
  WHERE signing_token = p_signing_token
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid signing token';
  END IF;
  
  IF v_signer.status IN ('signed', 'rejected') THEN
    RAISE EXCEPTION 'Cannot reject: already %', v_signer.status;
  END IF;
  
  -- Actualizar firmante
  UPDATE signing.signers
  SET status = 'rejected',
      rejection_reason = p_reason,
      rejected_at = NOW(),
      updated_at = NOW()
  WHERE id = v_signer.id;
  
  -- Notificar al gestor (el documento no cambia de estado automáticamente)
  -- Esto se manejará vía webhook o trigger de notificación
  
  RETURN jsonb_build_object('success', true, 'rejected_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reject_signature(UUID, TEXT) TO anon, authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RPCs de signing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '  - generate_qr_identifier()';
  RAISE NOTICE '  - create_signing_document()';
  RAISE NOTICE '  - add_document_signer()';
  RAISE NOTICE '  - remove_document_signer()';
  RAISE NOTICE '  - submit_document_for_review()';
  RAISE NOTICE '  - approve_document_review()';
  RAISE NOTICE '  - send_document_to_sign()';
  RAISE NOTICE '  - get_document_for_signing()';
  RAISE NOTICE '  - record_signature()';
  RAISE NOTICE '  - reject_signature()';
END $$;
