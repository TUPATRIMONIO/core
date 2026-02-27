-- =====================================================
-- Migration: Fix link_verification_to_signer Audit Log Params
-- Description: Corrige el orden de los parámetros en la llamada a log_audit_event
-- Created: 2026-02-26
-- =====================================================

CREATE OR REPLACE FUNCTION signing.link_verification_to_signer(
  p_signer_id UUID,
  p_verification_session_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session RECORD;
  v_signer RECORD;
BEGIN
  -- Obtener la sesión de verificación
  SELECT * INTO v_session
  FROM identity_verifications.verification_sessions
  WHERE id = p_verification_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sesión de verificación no encontrada';
  END IF;

  -- Verificar que la sesión está aprobada
  IF v_session.status != 'approved' THEN
    RAISE EXCEPTION 'La sesión de verificación no está aprobada';
  END IF;

  -- Obtener el firmante
  SELECT * INTO v_signer
  FROM signing.signers
  WHERE id = p_signer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Firmante no encontrado';
  END IF;

  -- Verificar que el email coincida (seguridad adicional)
  IF v_signer.email != v_session.subject_email THEN
    RAISE EXCEPTION 'El email del firmante no coincide con el de la verificación';
  END IF;

  -- Actualizar el firmante
  UPDATE signing.signers
  SET
    identity_verification_id = p_verification_session_id,
    identity_verified_at = v_session.verified_at,
    identity_verification_score = v_session.risk_score,
    updated_at = NOW()
  WHERE id = p_signer_id;

  -- Registrar en audit log (CORREGIDO: event_type primero, luego session_id)
  PERFORM identity_verifications.log_audit_event(
    'linked_to_signer',           -- p_event_type
    p_verification_session_id,    -- p_session_id
    jsonb_build_object(           -- p_event_data
      'signer_id', p_signer_id,
      'document_id', v_signer.document_id,
      'email', v_signer.email
    ),
    'system',                     -- p_actor_type
    auth.uid()                    -- p_actor_id
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.link_verification_to_signer TO authenticated;
GRANT EXECUTE ON FUNCTION signing.link_verification_to_signer TO service_role;

COMMENT ON FUNCTION signing.link_verification_to_signer IS 
  'Vincula una sesión de verificación aprobada a un firmante (Corregido audit log)';
