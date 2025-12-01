-- Migration: Función para convertir organización de B2C a B2B
-- Description: Convierte una organización personal (B2C) a empresarial (B2B) actualizando tipo, settings y límites del CRM
-- Created: 2025-01-15

-- =====================================================
-- FUNCIÓN: Convertir Organización de B2C a B2B
-- =====================================================

CREATE OR REPLACE FUNCTION public.convert_organization_b2c_to_b2b(
  p_organization_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_org_record RECORD;
  v_crm_app_id UUID;
  v_result JSONB;
BEGIN
  -- Verificar que la organización existe y es de tipo personal
  SELECT o.id, o.name, o.org_type, o.settings
  INTO v_org_record
  FROM core.organizations o
  WHERE o.id = p_organization_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organización no encontrada con ID: %', p_organization_id;
  END IF;
  
  IF v_org_record.org_type != 'personal' THEN
    RAISE EXCEPTION 'La organización % (ID: %) ya es de tipo %, no se puede convertir de B2C a B2B', 
      v_org_record.name, p_organization_id, v_org_record.org_type;
  END IF;
  
  -- Obtener ID de la aplicación CRM
  SELECT id INTO v_crm_app_id
  FROM core.applications
  WHERE slug = 'crm_sales'
  LIMIT 1;
  
  -- Actualizar el tipo de organización y settings
  UPDATE core.organizations
  SET 
    org_type = 'business',
    settings = jsonb_set(
      COALESCE(settings, '{}'::jsonb),
      '{user_type}',
      '"b2b"'
    ),
    updated_at = NOW()
  WHERE id = p_organization_id;
  
  -- Actualizar límites del CRM si existe la aplicación
  IF v_crm_app_id IS NOT NULL THEN
    UPDATE core.organization_applications
    SET config = jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(config, '{}'::jsonb),
          '{max_contacts}',
          '1000'
        ),
        '{max_users}',
        '5'
      ),
      '{api_access}',
      'true'
    )
    WHERE organization_id = p_organization_id
    AND application_id = v_crm_app_id;
    
    -- Si no existe registro en organization_applications, crearlo
    IF NOT FOUND THEN
      INSERT INTO core.organization_applications (
        organization_id,
        application_id,
        is_enabled,
        config
      ) VALUES (
        p_organization_id,
        v_crm_app_id,
        true,
        jsonb_build_object(
          'max_contacts', 1000,
          'max_users', 5,
          'email_integration', true,
          'custom_fields', true,
          'api_access', true,
          'automations', false
        )
      );
    END IF;
  END IF;
  
  -- Construir resultado
  SELECT jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'organization_name', v_org_record.name,
    'previous_type', 'personal',
    'new_type', 'business',
    'changes', jsonb_build_object(
      'org_type', 'personal -> business',
      'settings.user_type', 'b2c -> b2b',
      'crm_limits', jsonb_build_object(
        'max_contacts', '100 -> 1000',
        'max_users', '1 -> 5',
        'api_access', 'false -> true'
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.convert_organization_b2c_to_b2b(UUID) TO authenticated;

COMMENT ON FUNCTION public.convert_organization_b2c_to_b2b IS 
'Convierte una organización personal (B2C) a empresarial (B2B). Actualiza el tipo de organización, settings y límites del CRM. Solo funciona con organizaciones de tipo personal.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Función de Conversión B2C → B2B Creada';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Función creada:';
  RAISE NOTICE '  ✅ convert_organization_b2c_to_b2b(organization_id UUID)';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso:';
  RAISE NOTICE '  SELECT convert_organization_b2c_to_b2b(''<org-id>'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✅ org_type: personal → business';
  RAISE NOTICE '  ✅ settings.user_type: b2c → b2b';
  RAISE NOTICE '  ✅ CRM max_contacts: 100 → 1000';
  RAISE NOTICE '  ✅ CRM max_users: 1 → 5';
  RAISE NOTICE '  ✅ CRM api_access: false → true';
  RAISE NOTICE '';
END $$;

