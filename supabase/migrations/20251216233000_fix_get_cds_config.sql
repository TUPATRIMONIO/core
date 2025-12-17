-- =====================================================
-- Migration: Fix get_cds_config
-- Description: Agrega LIMIT 1 para evitar error de múltiples filas
-- Created: 2025-12-16
-- =====================================================

CREATE OR REPLACE FUNCTION signing.get_cds_config(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_provider RECORD;
  v_config RECORD;
  v_base_url TEXT;
BEGIN
  -- Obtener proveedor CDS
  SELECT * INTO v_provider
  FROM signing.providers
  WHERE slug = 'cds'
    AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proveedor CDS no encontrado o inactivo';
  END IF;
  
  -- Obtener configuración de la organización
  SELECT * INTO v_config
  FROM signing.provider_configs
  WHERE organization_id = p_organization_id
    AND provider_id = v_provider.id
    AND is_active = true
  LIMIT 1; -- FIX: Asegurar que solo retorne una fila
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuración de CDS no encontrada para organización %', p_organization_id;
  END IF;
  
  -- Determinar URL base según modo de prueba
  v_base_url := CASE 
    WHEN v_config.is_test_mode THEN v_provider.test_url
    ELSE v_provider.base_url
  END;
  
  -- Retornar configuración completa
  RETURN jsonb_build_object(
    'provider_id', v_provider.id,
    'provider_name', v_provider.name,
    'base_url', v_base_url,
    'is_test_mode', v_config.is_test_mode,
    'credentials', v_config.credentials,
    'endpoints', v_provider.endpoints,
    'webhook_url', v_config.webhook_url,
    'webhook_secret', v_config.webhook_secret
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.get_cds_config(UUID) TO authenticated, service_role;
