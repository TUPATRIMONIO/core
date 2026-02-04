-- =====================================================
-- Migration: Identity Verifications Helper Functions
-- Description: Funciones RPC para facilitar operaciones comunes
-- Created: 2026-02-04
-- =====================================================

SET search_path TO identity_verifications, core, public, extensions;

-- =====================================================
-- FUNCIÓN: Crear sesión de verificación
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.create_verification_session(
  p_organization_id UUID,
  p_provider_slug TEXT,
  p_purpose identity_verifications.verification_purpose,
  p_subject_identifier TEXT,
  p_subject_email TEXT,
  p_subject_name TEXT DEFAULT NULL,
  p_subject_phone TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_provider_id UUID;
  v_provider_config_id UUID;
  v_session_id UUID;
BEGIN
  -- Verificar que el usuario tiene acceso a la organización
  IF NOT identity_verifications.user_belongs_to_org(p_organization_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta organización';
  END IF;

  -- Obtener el proveedor
  SELECT id INTO v_provider_id
  FROM identity_verifications.providers
  WHERE slug = p_provider_slug AND is_active = true;

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Proveedor % no encontrado o inactivo', p_provider_slug;
  END IF;

  -- Obtener la configuración del proveedor para esta org
  SELECT id INTO v_provider_config_id
  FROM identity_verifications.provider_configs
  WHERE organization_id = p_organization_id
    AND provider_id = v_provider_id
    AND is_active = true
  LIMIT 1;

  IF v_provider_config_id IS NULL THEN
    RAISE EXCEPTION 'No hay configuración activa para el proveedor % en esta organización', p_provider_slug;
  END IF;

  -- Crear la sesión
  INSERT INTO identity_verifications.verification_sessions (
    organization_id,
    provider_id,
    provider_config_id,
    purpose,
    subject_identifier,
    subject_email,
    subject_name,
    subject_phone,
    reference_type,
    reference_id,
    metadata,
    created_by
  ) VALUES (
    p_organization_id,
    v_provider_id,
    v_provider_config_id,
    p_purpose,
    p_subject_identifier,
    p_subject_email,
    p_subject_name,
    p_subject_phone,
    p_reference_type,
    p_reference_id,
    p_metadata,
    auth.uid()
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION identity_verifications.create_verification_session TO authenticated;

COMMENT ON FUNCTION identity_verifications.create_verification_session IS 
  'Crea una nueva sesión de verificación de identidad';

-- =====================================================
-- FUNCIÓN: Obtener sesión con todos sus datos
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.get_verification_session_full(
  p_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verificar acceso a través de RLS
  SELECT jsonb_build_object(
    'session', to_jsonb(s),
    'provider', to_jsonb(p),
    'attempts', (
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attempt_number)
      FROM identity_verifications.verification_attempts a
      WHERE a.session_id = s.id
    ),
    'documents', (
      SELECT jsonb_agg(to_jsonb(d))
      FROM identity_verifications.verification_documents d
      WHERE d.session_id = s.id
    ),
    'media', (
      SELECT jsonb_agg(to_jsonb(m))
      FROM identity_verifications.verification_media m
      WHERE m.session_id = s.id
    )
  ) INTO v_result
  FROM identity_verifications.verification_sessions s
  LEFT JOIN identity_verifications.providers p ON p.id = s.provider_id
  WHERE s.id = p_session_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Sesión no encontrada o sin acceso';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION identity_verifications.get_verification_session_full TO authenticated;

COMMENT ON FUNCTION identity_verifications.get_verification_session_full IS 
  'Obtiene una sesión con todos sus datos relacionados (attempts, documents, media)';

-- =====================================================
-- FUNCIÓN: Buscar verificaciones previas de un sujeto
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.find_previous_verifications(
  p_organization_id UUID,
  p_subject_identifier TEXT DEFAULT NULL,
  p_subject_email TEXT DEFAULT NULL,
  p_only_approved BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  session_id UUID,
  provider_name TEXT,
  purpose identity_verifications.verification_purpose,
  status identity_verifications.session_status,
  verified_at TIMESTAMPTZ,
  risk_score DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verificar acceso a la organización
  IF NOT identity_verifications.user_belongs_to_org(p_organization_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta organización';
  END IF;

  RETURN QUERY
  SELECT 
    s.id,
    p.name,
    s.purpose,
    s.status,
    s.verified_at,
    s.risk_score,
    s.created_at
  FROM identity_verifications.verification_sessions s
  LEFT JOIN identity_verifications.providers p ON p.id = s.provider_id
  WHERE s.organization_id = p_organization_id
    AND (
      (p_subject_identifier IS NOT NULL AND s.subject_identifier = p_subject_identifier)
      OR (p_subject_email IS NOT NULL AND s.subject_email = p_subject_email)
    )
    AND (NOT p_only_approved OR s.status = 'approved')
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION identity_verifications.find_previous_verifications TO authenticated;

COMMENT ON FUNCTION identity_verifications.find_previous_verifications IS 
  'Busca verificaciones previas de un sujeto por identifier o email';

-- =====================================================
-- FUNCIÓN: Actualizar estado de sesión (SECURITY DEFINER)
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.update_session_status(
  p_session_id UUID,
  p_status identity_verifications.session_status,
  p_decision_code TEXT DEFAULT NULL,
  p_decision_reason TEXT DEFAULT NULL,
  p_risk_score DECIMAL DEFAULT NULL,
  p_raw_response JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_verified_at TIMESTAMPTZ;
BEGIN
  -- Si el estado es 'approved', establecer verified_at
  IF p_status = 'approved' THEN
    v_verified_at := NOW();
  ELSE
    v_verified_at := NULL;
  END IF;

  -- Actualizar la sesión
  UPDATE identity_verifications.verification_sessions
  SET
    status = p_status,
    decision_code = COALESCE(p_decision_code, decision_code),
    decision_reason = COALESCE(p_decision_reason, decision_reason),
    risk_score = COALESCE(p_risk_score, risk_score),
    verified_at = COALESCE(v_verified_at, verified_at),
    raw_response = COALESCE(p_raw_response, raw_response),
    updated_at = NOW()
  WHERE id = p_session_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo service_role puede ejecutar (para webhooks)
REVOKE ALL ON FUNCTION identity_verifications.update_session_status FROM PUBLIC;
REVOKE ALL ON FUNCTION identity_verifications.update_session_status FROM authenticated;
GRANT EXECUTE ON FUNCTION identity_verifications.update_session_status TO service_role;

COMMENT ON FUNCTION identity_verifications.update_session_status IS 
  'Actualiza el estado de una sesión (solo para webhooks vía service_role)';

-- =====================================================
-- FUNCIÓN: Registrar evento en audit log
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.log_audit_event(
  p_event_type TEXT,
  p_session_id UUID DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_actor_type identity_verifications.actor_type DEFAULT 'system',
  p_actor_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO identity_verifications.audit_log (
    session_id,
    event_type,
    event_data,
    actor_type,
    actor_id,
    ip_address,
    user_agent
  ) VALUES (
    p_session_id,
    p_event_type,
    p_event_data,
    p_actor_type,
    COALESCE(p_actor_id, auth.uid()),
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION identity_verifications.log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION identity_verifications.log_audit_event TO authenticated;

COMMENT ON FUNCTION identity_verifications.log_audit_event IS 
  'Registra un evento en el audit log';

-- =====================================================
-- FUNCIÓN: Obtener configuración de proveedor
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.get_provider_config(
  p_organization_id UUID,
  p_provider_slug TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'provider', to_jsonb(p),
    'config', pc.config,
    'credentials', pc.credentials,
    'is_test_mode', pc.is_test_mode,
    'webhook_url', pc.webhook_url
  ) INTO v_result
  FROM identity_verifications.provider_configs pc
  JOIN identity_verifications.providers p ON p.id = pc.provider_id
  WHERE pc.organization_id = p_organization_id
    AND p.slug = p_provider_slug
    AND pc.is_active = true
    AND p.is_active = true
  LIMIT 1;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'No se encontró configuración activa para el proveedor % en esta organización', p_provider_slug;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo service_role puede ejecutar (para edge functions)
REVOKE ALL ON FUNCTION identity_verifications.get_provider_config FROM PUBLIC;
REVOKE ALL ON FUNCTION identity_verifications.get_provider_config FROM authenticated;
GRANT EXECUTE ON FUNCTION identity_verifications.get_provider_config TO service_role;

COMMENT ON FUNCTION identity_verifications.get_provider_config IS 
  'Obtiene la configuración de un proveedor para una organización (solo service_role)';

-- =====================================================
-- FUNCIÓN: Verificar si una sesión está disponible
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.is_verification_valid(
  p_session_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM identity_verifications.verification_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verificar que está aprobada y no expirada
  RETURN v_session.status = 'approved'
    AND (v_session.expires_at IS NULL OR v_session.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION identity_verifications.is_verification_valid TO authenticated;
GRANT EXECUTE ON FUNCTION identity_verifications.is_verification_valid TO service_role;

COMMENT ON FUNCTION identity_verifications.is_verification_valid IS 
  'Verifica si una sesión de verificación es válida (aprobada y no expirada)';

-- =====================================================
-- FUNCIÓN: Estadísticas de verificaciones
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.get_verification_stats(
  p_organization_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  -- Verificar acceso
  IF NOT identity_verifications.user_belongs_to_org(p_organization_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta organización';
  END IF;

  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'declined', COUNT(*) FILTER (WHERE status = 'declined'),
    'pending', COUNT(*) FILTER (WHERE status IN ('pending', 'started', 'submitted')),
    'expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'abandoned', COUNT(*) FILTER (WHERE status = 'abandoned'),
    'by_purpose', (
      SELECT jsonb_object_agg(purpose, cnt)
      FROM (
        SELECT purpose, COUNT(*) as cnt
        FROM identity_verifications.verification_sessions
        WHERE organization_id = p_organization_id
          AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY purpose
      ) sub
    ),
    'avg_risk_score', AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL)
  ) INTO v_stats
  FROM identity_verifications.verification_sessions
  WHERE organization_id = p_organization_id
    AND created_at BETWEEN p_start_date AND p_end_date;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION identity_verifications.get_verification_stats TO authenticated;

COMMENT ON FUNCTION identity_verifications.get_verification_stats IS 
  'Obtiene estadísticas de verificaciones para una organización';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones RPC creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '  - create_verification_session()';
  RAISE NOTICE '  - get_verification_session_full()';
  RAISE NOTICE '  - find_previous_verifications()';
  RAISE NOTICE '  - update_session_status() [service_role]';
  RAISE NOTICE '  - log_audit_event()';
  RAISE NOTICE '  - get_provider_config() [service_role]';
  RAISE NOTICE '  - is_verification_valid()';
  RAISE NOTICE '  - get_verification_stats()';
END $$;
