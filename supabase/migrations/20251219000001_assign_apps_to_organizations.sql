-- =====================================================
-- Migration: Asignar Apps Base a Todas las Organizaciones
-- Description: Habilita las apps core para todas las organizaciones existentes
-- Created: 2025-12-19
-- =====================================================

-- Esta migración asigna las apps habilitadas a todas las organizaciones existentes.
-- Cada organización recibirá acceso a las apps activas (is_active = true).

DO $$
DECLARE
  org_record RECORD;
  app_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🚀 Iniciando asignación de apps a organizaciones...';
  
  -- Iterar sobre todas las organizaciones activas (excepto platform)
  FOR org_record IN 
    SELECT id, name, org_type 
    FROM core.organizations 
    WHERE deleted_at IS NULL
    AND org_type != 'platform'  -- La plataforma tiene acceso total por defecto
  LOOP
    RAISE NOTICE '  📁 Procesando organización: % (%)', org_record.name, org_record.org_type;
    
    -- Asignar cada app activa a esta organización
    FOR app_record IN 
      SELECT id, slug, name, category 
      FROM core.applications 
      WHERE is_active = true
    LOOP
      -- Insertar si no existe
      INSERT INTO core.organization_applications (
        organization_id,
        application_id,
        is_enabled,
        config,
        enabled_at
      )
      VALUES (
        org_record.id,
        app_record.id,
        true,
        (SELECT default_config FROM core.applications WHERE id = app_record.id),
        NOW()
      )
      ON CONFLICT (organization_id, application_id) DO UPDATE SET
        is_enabled = true,
        updated_at = NOW();
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Asignación completada';
  RAISE NOTICE '   Total de asignaciones: %', inserted_count;
END $$;

-- También asignar apps a organizaciones platform para los platform admins
-- (aunque ellos tienen acceso total, esto ayuda para la UI)
DO $$
DECLARE
  platform_org_id UUID;
  app_record RECORD;
BEGIN
  -- Obtener la organización platform
  SELECT id INTO platform_org_id
  FROM core.organizations
  WHERE org_type = 'platform'
  LIMIT 1;
  
  IF platform_org_id IS NOT NULL THEN
    RAISE NOTICE '🏢 Asignando apps a organización platform...';
    
    FOR app_record IN 
      SELECT id, slug, name 
      FROM core.applications
    LOOP
      INSERT INTO core.organization_applications (
        organization_id,
        application_id,
        is_enabled,
        config,
        enabled_at
      )
      VALUES (
        platform_org_id,
        app_record.id,
        true,
        (SELECT default_config FROM core.applications WHERE id = app_record.id),
        NOW()
      )
      ON CONFLICT (organization_id, application_id) DO UPDATE SET
        is_enabled = true,
        updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE '   ✅ Apps asignadas a organización platform';
  END IF;
END $$;

-- =====================================================
-- REPORTE FINAL
-- =====================================================

DO $$
DECLARE
  org_count INTEGER;
  app_count INTEGER;
  assignment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM core.organizations WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO app_count FROM core.applications WHERE is_active = true;
  SELECT COUNT(*) INTO assignment_count FROM core.organization_applications WHERE is_enabled = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumen de asignación de apps:';
  RAISE NOTICE '   Organizaciones activas: %', org_count;
  RAISE NOTICE '   Apps activas: %', app_count;
  RAISE NOTICE '   Total de asignaciones habilitadas: %', assignment_count;
  RAISE NOTICE '';
  RAISE NOTICE '💡 Para ver las apps de una organización:';
  RAISE NOTICE '   SELECT a.name, a.slug, oa.is_enabled';
  RAISE NOTICE '   FROM core.organization_applications oa';
  RAISE NOTICE '   JOIN core.applications a ON a.id = oa.application_id';
  RAISE NOTICE '   WHERE oa.organization_id = ''ORG_UUID_HERE'';';
END $$;
