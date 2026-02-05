-- =====================================================
-- Migration: Allow centralized Veriff configuration
-- Description: Permite usar la configuración de la org Platform para todas las organizaciones
--              Si una org no tiene config propia, usa la de Platform
-- Created: 2026-02-05
-- =====================================================

SET search_path TO identity_verifications, core, public, extensions;

-- =====================================================
-- FUNCIÓN ACTUALIZADA: Crear sesión con fallback a config Platform
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

  -- Intentar obtener la configuración específica de esta organización
  SELECT id INTO v_provider_config_id
  FROM identity_verifications.provider_configs
  WHERE organization_id = p_organization_id
    AND provider_id = v_provider_id
    AND is_active = true
  LIMIT 1;

  -- Si no tiene config propia, buscar la config de la organización Platform
  IF v_provider_config_id IS NULL THEN
    -- Obtener ID de la organización Platform (TuPatrimonio)
    -- Busca por nombre o slug que contenga 'tupatrimonio' o sea 'platform'
    SELECT id INTO v_platform_org_id
    FROM core.organizations
    WHERE name ILIKE '%tupatrimonio%'
       OR slug ILIKE '%tupatrimonio%'
       OR slug = 'platform'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_platform_org_id IS NOT NULL THEN
      -- Usar la configuración de Platform
      SELECT id INTO v_provider_config_id
      FROM identity_verifications.provider_configs
      WHERE organization_id = v_platform_org_id
        AND provider_id = v_provider_id
        AND is_active = true
      LIMIT 1;
    END IF;
  END IF;

  -- Si aún no hay config, fallar
  IF v_provider_config_id IS NULL THEN
    RAISE EXCEPTION 'No hay configuración activa para el proveedor % (ni en esta org ni en Platform)', p_provider_slug;
  END IF;

  -- Crear la sesión
  -- NOTA: La sesión se asocia a la organización solicitante (p_organization_id)
  -- pero usa la configuración del proveedor (que puede ser de Platform)
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
    p_organization_id,  -- Sesión pertenece a la org solicitante
    v_provider_id,
    v_provider_config_id,  -- Pero puede usar config de Platform
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

-- =====================================================
-- FUNCIÓN ACTUALIZADA: get_provider_config con fallback
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.get_provider_config(
  p_organization_id UUID,
  p_provider_slug TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_platform_org_id UUID;
BEGIN
  -- Intentar obtener config de la organización específica
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

  -- Si no hay config, buscar la de Platform
  IF v_result IS NULL THEN
    -- Buscar organización Platform (TuPatrimonio)
    SELECT id INTO v_platform_org_id
    FROM core.organizations
    WHERE name ILIKE '%tupatrimonio%'
       OR slug ILIKE '%tupatrimonio%'
       OR slug = 'platform'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_platform_org_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'provider', to_jsonb(p),
        'config', pc.config,
        'credentials', pc.credentials,
        'is_test_mode', pc.is_test_mode,
        'webhook_url', pc.webhook_url
      ) INTO v_result
      FROM identity_verifications.provider_configs pc
      JOIN identity_verifications.providers p ON p.id = pc.provider_id
      WHERE pc.organization_id = v_platform_org_id
        AND p.slug = p_provider_slug
        AND pc.is_active = true
        AND p.is_active = true
      LIMIT 1;
    END IF;
  END IF;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'No se encontró configuración activa para el proveedor % (ni en esta org ni en Platform)', p_provider_slug;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Configuración centralizada habilitada';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora las funciones soportan:';
  RAISE NOTICE '  1. Config específica por organización (si existe)';
  RAISE NOTICE '  2. Fallback a config de organización Platform';
  RAISE NOTICE '  3. Esto permite un modelo centralizado donde TuPatrimonio';
  RAISE NOTICE '     gestiona una sola cuenta de Veriff para todos';
END $$;
