-- =====================================================
-- Migration: Add identity verification to signing.signers
-- Description: Integración entre verificaciones de identidad y firmantes
-- Created: 2026-02-04
-- =====================================================

SET search_path TO signing, identity_verifications, core, public, extensions;

-- =====================================================
-- AGREGAR COLUMNAS A signing.signers
-- =====================================================

-- Referencia a la sesión de verificación de identidad
ALTER TABLE signing.signers 
ADD COLUMN IF NOT EXISTS identity_verification_id UUID 
  REFERENCES identity_verifications.verification_sessions(id) ON DELETE SET NULL;

-- Fecha cuando se verificó la identidad
ALTER TABLE signing.signers 
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

-- Nivel de confianza de la verificación (copiado desde la sesión)
ALTER TABLE signing.signers 
ADD COLUMN IF NOT EXISTS identity_verification_score DECIMAL(5,2);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_signers_identity_verification 
  ON signing.signers(identity_verification_id) 
  WHERE identity_verification_id IS NOT NULL;

-- =====================================================
-- FUNCIÓN: Vincular verificación a firmante
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

  -- Registrar en audit log
  PERFORM identity_verifications.log_audit_event(
    p_verification_session_id,
    'linked_to_signer',
    jsonb_build_object(
      'signer_id', p_signer_id,
      'document_id', v_signer.document_id,
      'email', v_signer.email
    ),
    'system',
    auth.uid()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.link_verification_to_signer TO authenticated;
GRANT EXECUTE ON FUNCTION signing.link_verification_to_signer TO service_role;

COMMENT ON FUNCTION signing.link_verification_to_signer IS 
  'Vincula una sesión de verificación aprobada a un firmante';

-- =====================================================
-- FUNCIÓN: Verificar si un firmante tiene verificación válida
-- =====================================================

CREATE OR REPLACE FUNCTION signing.signer_has_valid_verification(
  p_signer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_signer RECORD;
BEGIN
  SELECT * INTO v_signer
  FROM signing.signers
  WHERE id = p_signer_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Si no tiene verificación asociada
  IF v_signer.identity_verification_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar que la sesión sigue siendo válida
  RETURN identity_verifications.is_verification_valid(v_signer.identity_verification_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.signer_has_valid_verification TO authenticated;
GRANT EXECUTE ON FUNCTION signing.signer_has_valid_verification TO service_role;

COMMENT ON FUNCTION signing.signer_has_valid_verification IS 
  'Verifica si un firmante tiene una verificación de identidad válida';

-- =====================================================
-- VISTA: Firmantes con información de verificación
-- =====================================================

CREATE OR REPLACE VIEW signing.signers_with_verification AS
SELECT 
  s.*,
  vs.status as verification_status,
  vs.verified_at as verification_date,
  vs.risk_score as verification_risk_score,
  vs.provider_id as verification_provider_id,
  p.name as verification_provider_name,
  CASE 
    WHEN vs.id IS NULL THEN false
    WHEN vs.status = 'approved' AND (vs.expires_at IS NULL OR vs.expires_at > NOW()) THEN true
    ELSE false
  END as has_valid_verification
FROM signing.signers s
LEFT JOIN identity_verifications.verification_sessions vs ON vs.id = s.identity_verification_id
LEFT JOIN identity_verifications.providers p ON p.id = vs.provider_id;

-- RLS se aplica automáticamente a través de las tablas base
GRANT SELECT ON signing.signers_with_verification TO authenticated;

COMMENT ON VIEW signing.signers_with_verification IS 
  'Vista de firmantes con información completa de verificación de identidad';

-- =====================================================
-- FUNCIÓN: Obtener o crear sesión de verificación para firmante
-- =====================================================

CREATE OR REPLACE FUNCTION signing.get_or_create_verification_for_signer(
  p_signer_id UUID,
  p_purpose identity_verifications.verification_purpose DEFAULT 'fes_signing'
)
RETURNS UUID AS $$
DECLARE
  v_signer RECORD;
  v_document RECORD;
  v_session_id UUID;
  v_existing_verification UUID;
BEGIN
  -- Obtener el firmante
  SELECT s.*, d.organization_id
  INTO v_signer
  FROM signing.signers s
  JOIN signing.documents d ON d.id = s.document_id
  WHERE s.id = p_signer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Firmante no encontrado';
  END IF;

  -- Verificar si ya tiene una verificación válida
  IF signing.signer_has_valid_verification(p_signer_id) THEN
    RETURN v_signer.identity_verification_id;
  END IF;

  -- Buscar verificación previa aprobada del mismo sujeto
  SELECT id INTO v_existing_verification
  FROM identity_verifications.verification_sessions
  WHERE organization_id = v_signer.organization_id
    AND (
      (v_signer.rut IS NOT NULL AND subject_identifier = v_signer.rut)
      OR subject_email = v_signer.email
    )
    AND status = 'approved'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY verified_at DESC
  LIMIT 1;

  -- Si encontramos una verificación previa, vincularla
  IF v_existing_verification IS NOT NULL THEN
    PERFORM signing.link_verification_to_signer(p_signer_id, v_existing_verification);
    RETURN v_existing_verification;
  END IF;

  -- Crear nueva sesión de verificación
  v_session_id := identity_verifications.create_verification_session(
    v_signer.organization_id,
    'veriff', -- Proveedor por defecto
    p_purpose,
    v_signer.rut,
    v_signer.email,
    v_signer.full_name,
    v_signer.phone,
    'signing_document',
    v_signer.document_id,
    jsonb_build_object(
      'signer_id', p_signer_id,
      'auto_created', true
    )
  );

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.get_or_create_verification_for_signer TO authenticated;
GRANT EXECUTE ON FUNCTION signing.get_or_create_verification_for_signer TO service_role;

COMMENT ON FUNCTION signing.get_or_create_verification_for_signer IS 
  'Obtiene una verificación existente válida o crea una nueva para un firmante';

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN signing.signers.identity_verification_id IS 
  'Referencia a la sesión de verificación de identidad';

COMMENT ON COLUMN signing.signers.identity_verified_at IS 
  'Fecha cuando se verificó la identidad del firmante';

COMMENT ON COLUMN signing.signers.identity_verification_score IS 
  'Score de riesgo de la verificación (copiado desde la sesión)';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Integración con signing completada';
  RAISE NOTICE '';
  RAISE NOTICE 'Columnas agregadas a signing.signers:';
  RAISE NOTICE '  - identity_verification_id';
  RAISE NOTICE '  - identity_verified_at';
  RAISE NOTICE '  - identity_verification_score';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '  - signing.link_verification_to_signer()';
  RAISE NOTICE '  - signing.signer_has_valid_verification()';
  RAISE NOTICE '  - signing.get_or_create_verification_for_signer()';
  RAISE NOTICE '';
  RAISE NOTICE 'Vista creada:';
  RAISE NOTICE '  - signing.signers_with_verification';
END $$;
