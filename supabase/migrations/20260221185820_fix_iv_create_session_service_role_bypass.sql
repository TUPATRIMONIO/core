-- =====================================================
-- Migration: Bypass org check for service_role in create_verification_session
-- Description: Cuando auth.uid() es NULL (service_role o trigger), se omite
--              la verificación de pertenencia a la organización.
--              Mismo patrón usado en signing.assign_document_to_notary.
-- Created: 2026-02-21
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
  v_platform_org_id UUID;
  v_session_id UUID;
BEGIN
  -- Bypass si auth.uid() es NULL (contexto service_role/trigger)
  IF auth.uid() IS NOT NULL AND NOT identity_verifications.user_belongs_to_org(p_organization_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta organización';
  END IF;

  SELECT id INTO v_provider_id
  FROM identity_verifications.providers
  WHERE slug = p_provider_slug AND is_active = true;

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Proveedor % no encontrado o inactivo', p_provider_slug;
  END IF;

  SELECT id INTO v_provider_config_id
  FROM identity_verifications.provider_configs
  WHERE organization_id = p_organization_id
    AND provider_id = v_provider_id
    AND is_active = true
  LIMIT 1;

  IF v_provider_config_id IS NULL THEN
    SELECT id INTO v_platform_org_id
    FROM core.organizations
    WHERE name ILIKE '%tupatrimonio%'
       OR slug ILIKE '%tupatrimonio%'
       OR slug = 'platform'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_platform_org_id IS NOT NULL THEN
      SELECT id INTO v_provider_config_id
      FROM identity_verifications.provider_configs
      WHERE organization_id = v_platform_org_id
        AND provider_id = v_provider_id
        AND is_active = true
      LIMIT 1;
    END IF;
  END IF;

  IF v_provider_config_id IS NULL THEN
    RAISE EXCEPTION 'No hay configuración activa para el proveedor % (ni en esta org ni en Platform)', p_provider_slug;
  END IF;

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
