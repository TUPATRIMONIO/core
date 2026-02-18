-- Migration: Seed Veriff Provider Config
-- Description: Insertar configuración inicial de Veriff para la organización principal
-- Created: 2026-02-18

DO $$
DECLARE
  v_provider_id UUID;
  v_organization_id UUID;
BEGIN
  -- 1. Obtener ID del proveedor Veriff
  SELECT id INTO v_provider_id
  FROM identity_verifications.providers
  WHERE slug = 'veriff';

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Proveedor Veriff no encontrado';
  END IF;

  -- 2. Obtener ID de la organización principal (asumiendo que existe al menos una)
  -- Ajustar esto según la lógica de tu aplicación para determinar la organización principal
  SELECT id INTO v_organization_id
  FROM core.organizations
  LIMIT 1;

  IF v_organization_id IS NULL THEN
    RAISE NOTICE 'No se encontró ninguna organización en core.organizations. No se insertará configuración.';
    RETURN;
  END IF;

  -- 3. Insertar configuración
  INSERT INTO identity_verifications.provider_configs (
    organization_id,
    provider_id,
    credentials,
    is_active,
    is_test_mode
  ) VALUES (
    v_organization_id,
    v_provider_id,
    jsonb_build_object(
      'api_key', 'PLACEHOLDER_API_KEY',
      'api_secret', 'PLACEHOLDER_API_SECRET'
    ),
    true,
    true -- Test mode por defecto
  )
  ON CONFLICT (organization_id, provider_id) DO NOTHING;

  RAISE NOTICE '✅ Configuración de Veriff creada para la organización % (ID: %)', v_organization_id, v_organization_id;
  RAISE NOTICE '⚠️ IMPORTANTE: Debes actualizar las credenciales (api_key, api_secret) en la base de datos.';

END $$;
