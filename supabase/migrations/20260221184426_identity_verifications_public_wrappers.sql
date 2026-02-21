-- =====================================================
-- Migration: Public schema wrappers for identity_verifications
-- Description: Crea funciones wrapper en public que delegan a identity_verifications.*
--              Necesario porque PostgREST solo expone ciertos esquemas
-- Created: 2026-02-21
-- =====================================================

-- =====================================================
-- WRAPPER: iv_get_provider_config
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_get_provider_config(
  p_organization_id UUID,
  p_provider_slug TEXT
)
RETURNS JSONB AS $$
BEGIN
  RETURN identity_verifications.get_provider_config(p_organization_id, p_provider_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.iv_get_provider_config FROM PUBLIC;
REVOKE ALL ON FUNCTION public.iv_get_provider_config FROM authenticated;
GRANT EXECUTE ON FUNCTION public.iv_get_provider_config TO service_role;

-- =====================================================
-- WRAPPER: iv_create_verification_session
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_create_verification_session(
  p_organization_id UUID,
  p_provider_slug TEXT,
  p_purpose TEXT,
  p_subject_identifier TEXT,
  p_subject_email TEXT,
  p_subject_name TEXT DEFAULT NULL,
  p_subject_phone TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
BEGIN
  RETURN identity_verifications.create_verification_session(
    p_organization_id,
    p_provider_slug,
    p_purpose::identity_verifications.verification_purpose,
    p_subject_identifier,
    p_subject_email,
    p_subject_name,
    p_subject_phone,
    p_reference_type,
    p_reference_id,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.iv_create_verification_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.iv_create_verification_session TO service_role;

-- =====================================================
-- WRAPPER: iv_log_audit_event
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_log_audit_event(
  p_event_type TEXT,
  p_session_id UUID DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_actor_type TEXT DEFAULT 'system',
  p_actor_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN identity_verifications.log_audit_event(
    p_event_type,
    p_session_id,
    p_event_data,
    p_actor_type::identity_verifications.actor_type,
    p_actor_id,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.iv_log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION public.iv_log_audit_event TO authenticated;

-- =====================================================
-- WRAPPER: iv_get_verification_session_full
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_get_verification_session_full(
  p_session_id UUID
)
RETURNS JSONB AS $$
BEGIN
  RETURN identity_verifications.get_verification_session_full(p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.iv_get_verification_session_full TO authenticated;
GRANT EXECUTE ON FUNCTION public.iv_get_verification_session_full TO service_role;

-- =====================================================
-- WRAPPER: iv_is_verification_valid
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_is_verification_valid(
  p_session_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN identity_verifications.is_verification_valid(p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.iv_is_verification_valid TO authenticated;
GRANT EXECUTE ON FUNCTION public.iv_is_verification_valid TO service_role;

-- =====================================================
-- WRAPPER: iv_find_previous_verifications
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_find_previous_verifications(
  p_organization_id UUID,
  p_subject_identifier TEXT DEFAULT NULL,
  p_subject_email TEXT DEFAULT NULL,
  p_only_approved BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  session_id UUID,
  provider_name TEXT,
  purpose TEXT,
  status TEXT,
  verified_at TIMESTAMPTZ,
  risk_score DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.session_id,
    f.provider_name,
    f.purpose::TEXT,
    f.status::TEXT,
    f.verified_at,
    f.risk_score,
    f.created_at
  FROM identity_verifications.find_previous_verifications(
    p_organization_id, p_subject_identifier, p_subject_email, p_only_approved, p_limit
  ) f;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.iv_find_previous_verifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.iv_find_previous_verifications TO service_role;

-- =====================================================
-- WRAPPER: iv_update_session_status
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_update_session_status(
  p_session_id UUID,
  p_status TEXT,
  p_decision_code TEXT DEFAULT NULL,
  p_decision_reason TEXT DEFAULT NULL,
  p_risk_score DECIMAL DEFAULT NULL,
  p_raw_response JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN identity_verifications.update_session_status(
    p_session_id,
    p_status::identity_verifications.session_status,
    p_decision_code,
    p_decision_reason,
    p_risk_score,
    p_raw_response
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.iv_update_session_status FROM PUBLIC;
REVOKE ALL ON FUNCTION public.iv_update_session_status FROM authenticated;
GRANT EXECUTE ON FUNCTION public.iv_update_session_status TO service_role;

-- =====================================================
-- WRAPPER: iv_get_verification_stats
-- =====================================================
CREATE OR REPLACE FUNCTION public.iv_get_verification_stats(
  p_organization_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
BEGIN
  RETURN identity_verifications.get_verification_stats(p_organization_id, p_start_date, p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.iv_get_verification_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.iv_get_verification_stats TO service_role;

DO $$
BEGIN
  RAISE NOTICE 'Wrappers publicos creados para identity_verifications';
END $$;
