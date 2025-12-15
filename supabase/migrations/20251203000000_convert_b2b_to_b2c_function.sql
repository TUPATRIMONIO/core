-- Migration: Función para convertir organización de B2B a B2C
-- Description: Convierte una organización empresarial (B2B) a personal (B2C) actualizando tipo, settings y límites del CRM
-- Created: 2025-12-03

-- =====================================================
-- FUNCIÓN: Convertir Organización de B2B a B2C
-- =====================================================

CREATE OR REPLACE FUNCTION public.convert_organization_b2b_to_b2c(
  p_organization_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_org_record RECORD;
  v_crm_app_id UUID;
  v_result JSONB;
BEGIN
  -- Verificar que la organización existe y es de tipo business
  SELECT o.id, o.name, o.org_type, o.settings
  INTO v_org_record
  FROM core.organizations o
  WHERE o.id = p_organization_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organización no encontrada con ID: %', p_organization_id;
  END IF;
  
  IF v_org_record.org_type != 'business' THEN
    RAISE EXCEPTION 'La organización % (ID: %) ya es de tipo %, no se puede convertir de B2B a B2C', 
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
    org_type = 'personal',
    settings = jsonb_set(
      COALESCE(settings, '{}'::jsonb),
      '{user_type}',
      '"b2c"'
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
          '100'
        ),
        '{max_users}',
        '1'
      ),
      '{api_access}',
      'false'
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
          'max_contacts', 100,
          'max_users', 1,
          'email_integration', true,
          'custom_fields', true,
          'api_access', false,
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
    'previous_type', 'business',
    'new_type', 'personal',
    'changes', jsonb_build_object(
      'org_type', 'business -> personal',
      'settings.user_type', 'b2b -> b2c',
      'crm_limits', jsonb_build_object(
        'max_contacts', '1000 -> 100',
        'max_users', '5 -> 1',
        'api_access', 'true -> false'
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.convert_organization_b2b_to_b2c(UUID) TO authenticated;

COMMENT ON FUNCTION public.convert_organization_b2b_to_b2c IS 
'Convierte una organización empresarial (B2B) a personal (B2C). Actualiza el tipo de organización, settings y límites del CRM. Solo funciona con organizaciones de tipo business.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Función de Conversión B2B → B2C Creada';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Función creada:';
  RAISE NOTICE '  ✅ convert_organization_b2b_to_b2c(organization_id UUID)';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso:';
  RAISE NOTICE '  SELECT convert_organization_b2b_to_b2c(''<org-id>'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✅ org_type: business → personal';
  RAISE NOTICE '  ✅ settings.user_type: b2b → b2c';
  RAISE NOTICE '  ✅ CRM max_contacts: 1000 → 100';
  RAISE NOTICE '  ✅ CRM max_users: 5 → 1';
  RAISE NOTICE '  ✅ CRM api_access: true → false';
  RAISE NOTICE '';
END $$;
















