-- =====================================================
-- Migration: Fix create_business_organization size_category handling
-- Description: Manejar correctamente size_category que solo acepta valores específicos
-- Created: 2025-11-23
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Error: El campo size_category tiene un CHECK constraint que solo acepta:
--   'startup', 'small', 'medium', 'large', 'enterprise'
-- Pero la función estaba intentando insertar valores libres como "11-50 empleados"
-- Solución: Mapear el valor a NULL si no coincide y guardar el original en settings

-- =====================================================
-- FIX: Actualizar función create_business_organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_business_organization(
  user_id UUID,
  user_email TEXT,
  org_name TEXT,
  org_industry TEXT DEFAULT NULL,
  org_size TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  owner_role_id UUID;
  crm_app_id UUID;
  safe_slug TEXT;
BEGIN
  -- Crear entrada en core.users si no existe
  INSERT INTO core.users (id, status)
  VALUES (
    create_business_organization.user_id,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

  -- Generar slug seguro desde nombre de empresa
  safe_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  safe_slug := regexp_replace(safe_slug, '^-+|-+$', '', 'g');
  safe_slug := substring(safe_slug, 1, 50);
  
  -- Hacer slug único si ya existe
  IF EXISTS (SELECT 1 FROM core.organizations WHERE slug = safe_slug) THEN
    safe_slug := safe_slug || '-' || substring(create_business_organization.user_id::text, 1, 8);
  END IF;

  -- Crear organización empresarial
  -- Nota: size_category solo acepta valores específicos ('startup', 'small', 'medium', 'large', 'enterprise')
  -- Si org_size no coincide, guardamos el valor original en settings y dejamos size_category como NULL
  INSERT INTO core.organizations (
    name,
    slug,
    org_type,
    status,
    industry,
    size_category,
    settings
  ) VALUES (
    org_name,
    safe_slug,
    'business',
    'trial',
    org_industry,
    CASE 
      WHEN org_size IN ('startup', 'small', 'medium', 'large', 'enterprise') THEN org_size
      ELSE NULL
    END,
    jsonb_build_object(
      'is_personal_org', false,
      'user_type', 'b2b',
      'size_text', org_size  -- Guardar valor original en settings
    )
  )
  RETURNING id INTO new_org_id;
  
  -- Obtener rol de owner
  SELECT id INTO owner_role_id
  FROM core.roles
  WHERE slug = 'org_owner'
  LIMIT 1;
  
  -- Asignar usuario como owner
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    new_org_id,
    create_business_organization.user_id,
    owner_role_id,
    'active'
  );
  
  -- Habilitar CRM para esta org (con límites de plan business)
  SELECT id INTO crm_app_id
  FROM core.applications
  WHERE slug = 'crm_sales'
  LIMIT 1;
  
  IF crm_app_id IS NOT NULL THEN
    INSERT INTO core.organization_applications (
      organization_id,
      application_id,
      is_enabled,
      config
    ) VALUES (
      new_org_id,
      crm_app_id,
      true,
      jsonb_build_object(
        'max_contacts', 1000,        -- Límite para plan business
        'max_users', 5,               -- Hasta 5 usuarios
        'email_integration', true,
        'custom_fields', true,
        'api_access', true,
        'automations', false
      )
    );
    
    -- Crear settings de CRM
    INSERT INTO crm.settings (organization_id)
    VALUES (new_org_id)
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;
  
  -- Actualizar last_active_organization_id del usuario
  UPDATE core.users
  SET last_active_organization_id = new_org_id
  WHERE id = create_business_organization.user_id;
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función create_business_organization corregida';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambio realizado:';
  RAISE NOTICE '  ✅ size_category ahora valida contra valores permitidos';
  RAISE NOTICE '  ✅ Valor original guardado en settings.size_text';
  RAISE NOTICE '';
  RAISE NOTICE 'Valores permitidos para size_category:';
  RAISE NOTICE '  - startup, small, medium, large, enterprise';
  RAISE NOTICE '  - Cualquier otro valor se guarda como NULL en size_category';
  RAISE NOTICE '  - Pero se preserva en settings.size_text';
END $$;

