/**
 * Migración: Migrar Pipelines Existentes y Crear Datos por Defecto
 * 
 * Migra pipelines existentes de JSONB stages a pipeline_stages
 * Crea pipelines y propiedades por defecto para todas las entidades
 * 
 * Fecha: 17 Noviembre 2025
 */

SET search_path TO crm, core, public, extensions;

-- ============================================================================
-- 1. MIGRAR STAGES DE JSONB A TABLA
-- ============================================================================

DO $$
DECLARE
  pipeline_record RECORD;
  stage_json JSONB;
  stage_order INTEGER;
BEGIN
  -- Iterar sobre todos los pipelines existentes
  FOR pipeline_record IN 
    SELECT id, stages, entity_type FROM crm.pipelines WHERE stages IS NOT NULL
  LOOP
    -- Si stages es un array JSONB, migrar cada stage
    IF jsonb_typeof(pipeline_record.stages) = 'array' THEN
      stage_order := 0;
      FOR stage_json IN SELECT * FROM jsonb_array_elements(pipeline_record.stages)
      LOOP
        -- Insertar stage en pipeline_stages
        INSERT INTO crm.pipeline_stages (
          pipeline_id,
          name,
          slug,
          color,
          display_order,
          probability,
          is_final,
          final_type
        ) VALUES (
          pipeline_record.id,
          stage_json->>'name',
          -- Generar slug válido: normalizar, limpiar y asegurar que empiece con letra
          CASE 
            WHEN TRIM(BOTH '_' FROM 
              REGEXP_REPLACE(
                LOWER(
                  TRANSLATE(
                    stage_json->>'name',
                    'áéíóúàèìòùäëïöüâêîôûñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑ',
                    'aeiouaeiouaeiouaeiounAEIOUAEIOUAEIOUAEIOUN'
                  )
                ),
                '[^a-z0-9]+', '_', 'g'
              )
            ) ~ '^[a-z]' 
            THEN TRIM(BOTH '_' FROM 
              REGEXP_REPLACE(
                LOWER(
                  TRANSLATE(
                    stage_json->>'name',
                    'áéíóúàèìòùäëïöüâêîôûñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑ',
                    'aeiouaeiouaeiouaeiounAEIOUAEIOUAEIOUAEIOUN'
                  )
                ),
                '[^a-z0-9]+', '_', 'g'
              )
            )
            ELSE 'stage_' || TRIM(BOTH '_' FROM 
              REGEXP_REPLACE(
                LOWER(
                  TRANSLATE(
                    stage_json->>'name',
                    'áéíóúàèìòùäëïöüâêîôûñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑ',
                    'aeiouaeiouaeiouaeiounAEIOUAEIOUAEIOUAEIOUN'
                  )
                ),
                '[^a-z0-9]+', '_', 'g'
              )
            )
          END,
          COALESCE(stage_json->>'color', '#3b82f6'),
          COALESCE((stage_json->>'order')::INTEGER, stage_order),
          (stage_json->>'probability')::INTEGER,
          COALESCE((stage_json->>'probability')::INTEGER = 100, false),
          CASE 
            WHEN (stage_json->>'probability')::INTEGER = 100 THEN 'won'
            WHEN (stage_json->>'probability')::INTEGER = 0 THEN 'lost'
            ELSE NULL
          END
        )
        ON CONFLICT (pipeline_id, slug) DO NOTHING;
        
        stage_order := stage_order + 1;
      END LOOP;
      
      RAISE NOTICE 'Migrated % stages for pipeline %', stage_order, pipeline_record.id;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 2. CREAR PIPELINES POR DEFECTO PARA CADA ENTIDAD
-- ============================================================================

-- Pipeline para TICKETS (Soporte Técnico)
INSERT INTO crm.pipelines (organization_id, name, type, entity_type, category, description, color, is_default, is_active)
SELECT 
  id,
  'Soporte Técnico',
  'tickets', -- Agregar type para compatibilidad
  'ticket',
  'technical',
  'Pipeline por defecto para tickets de soporte técnico',
  '#3b82f6',
  true,
  true
FROM core.organizations
WHERE org_type = 'platform'
ON CONFLICT (organization_id, entity_type, name) DO NOTHING;

-- Stages para Soporte Técnico
DO $$
DECLARE
  org_record RECORD;
  pipeline_id_var UUID;
BEGIN
  FOR org_record IN SELECT id FROM core.organizations WHERE org_type = 'platform'
  LOOP
    SELECT id INTO pipeline_id_var
    FROM crm.pipelines
    WHERE organization_id = org_record.id
      AND entity_type = 'ticket'
      AND name = 'Soporte Técnico'
    LIMIT 1;
    
    IF pipeline_id_var IS NOT NULL THEN
      INSERT INTO crm.pipeline_stages (pipeline_id, name, slug, color, display_order, is_final) VALUES
        (pipeline_id_var, 'Nuevo', 'nuevo', '#3b82f6', 0, false),
        (pipeline_id_var, 'En Progreso', 'en_progreso', '#f59e0b', 1, false),
        (pipeline_id_var, 'Esperando Cliente', 'esperando_cliente', '#8b5cf6', 2, false),
        (pipeline_id_var, 'Resuelto', 'resuelto', '#10b981', 3, true),
        (pipeline_id_var, 'Cerrado', 'cerrado', '#6b7280', 4, true)
      ON CONFLICT (pipeline_id, slug) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Pipeline para CONTACTS (Lifecycle)
INSERT INTO crm.pipelines (organization_id, name, type, entity_type, description, color, is_default, is_active)
SELECT 
  id,
  'Lifecycle de Contacto',
  'deals', -- Usar 'deals' como valor dummy para compatibilidad (campo deprecado)
  'contact',
  'Ciclo de vida del contacto desde lead hasta promotor',
  '#8b5cf6',
  true,
  true
FROM core.organizations
WHERE org_type = 'platform'
ON CONFLICT (organization_id, entity_type, name) DO NOTHING;

-- Stages para Contacts
DO $$
DECLARE
  org_record RECORD;
  pipeline_id_var UUID;
BEGIN
  FOR org_record IN SELECT id FROM core.organizations WHERE org_type = 'platform'
  LOOP
    SELECT id INTO pipeline_id_var
    FROM crm.pipelines
    WHERE organization_id = org_record.id
      AND entity_type = 'contact'
      AND name = 'Lifecycle de Contacto'
    LIMIT 1;
    
    IF pipeline_id_var IS NOT NULL THEN
      INSERT INTO crm.pipeline_stages (pipeline_id, name, slug, color, display_order, probability, is_final) VALUES
        (pipeline_id_var, 'Lead', 'lead', '#94a3b8', 0, 10, false),
        (pipeline_id_var, 'MQL', 'mql', '#60a5fa', 1, 25, false),
        (pipeline_id_var, 'SQL', 'sql', '#fbbf24', 2, 50, false),
        (pipeline_id_var, 'Cliente', 'cliente', '#22c55e', 3, 100, true),
        (pipeline_id_var, 'Promotor', 'promotor', '#10b981', 4, 100, true)
      ON CONFLICT (pipeline_id, slug) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Pipeline para COMPANIES
INSERT INTO crm.pipelines (organization_id, name, type, entity_type, description, color, is_default, is_active)
SELECT 
  id,
  'B2B Journey',
  'deals', -- Usar 'deals' como valor dummy para compatibilidad (campo deprecado)
  'company',
  'Viaje de empresas desde prospecto hasta cliente',
  '#fb923c',
  true,
  true
FROM core.organizations
WHERE org_type = 'platform'
ON CONFLICT (organization_id, entity_type, name) DO NOTHING;

-- Stages para Companies
DO $$
DECLARE
  org_record RECORD;
  pipeline_id_var UUID;
BEGIN
  FOR org_record IN SELECT id FROM core.organizations WHERE org_type = 'platform'
  LOOP
    SELECT id INTO pipeline_id_var
    FROM crm.pipelines
    WHERE organization_id = org_record.id
      AND entity_type = 'company'
      AND name = 'B2B Journey'
    LIMIT 1;
    
    IF pipeline_id_var IS NOT NULL THEN
      INSERT INTO crm.pipeline_stages (pipeline_id, name, slug, color, display_order, probability, is_final) VALUES
        (pipeline_id_var, 'Prospecto', 'prospecto', '#94a3b8', 0, 10, false),
        (pipeline_id_var, 'Calificación', 'calificacion', '#60a5fa', 1, 30, false),
        (pipeline_id_var, 'Partner', 'partner', '#a78bfa', 2, 70, false),
        (pipeline_id_var, 'Cliente', 'cliente', '#22c55e', 3, 100, true)
      ON CONFLICT (pipeline_id, slug) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 3. CREAR PROPIEDADES PERSONALIZADAS POR DEFECTO
-- ============================================================================

-- Propiedades para TICKETS
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM core.organizations WHERE org_type = 'platform'
  LOOP
    -- Tipo de Usuario
    INSERT INTO crm.entity_properties (
      organization_id, entity_type, property_name, property_key, property_type,
      options, display_order, is_visible
    ) VALUES (
      org_record.id, 'ticket', 'Tipo de Usuario', 'tipo_usuario', 'single_select',
      '["Free", "Premium", "Enterprise"]'::jsonb, 0, true
    ) ON CONFLICT (organization_id, entity_type, property_key) DO NOTHING;
    
    -- Urgencia
    INSERT INTO crm.entity_properties (
      organization_id, entity_type, property_name, property_key, property_type,
      options, display_order, is_visible
    ) VALUES (
      org_record.id, 'ticket', 'Urgencia', 'urgencia', 'single_select',
      '["Baja", "Media", "Alta", "Crítica"]'::jsonb, 1, true
    ) ON CONFLICT (organization_id, entity_type, property_key) DO NOTHING;
    
    -- Canal
    INSERT INTO crm.entity_properties (
      organization_id, entity_type, property_name, property_key, property_type,
      options, display_order, is_visible
    ) VALUES (
      org_record.id, 'ticket', 'Canal', 'canal', 'single_select',
      '["Email", "WhatsApp", "Teléfono", "Web", "Chat"]'::jsonb, 2, true
    ) ON CONFLICT (organization_id, entity_type, property_key) DO NOTHING;
  END LOOP;
END $$;

-- Propiedades para CONTACTS
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM core.organizations WHERE org_type = 'platform'
  LOOP
    -- Fuente
    INSERT INTO crm.entity_properties (
      organization_id, entity_type, property_name, property_key, property_type,
      options, display_order, is_visible
    ) VALUES (
      org_record.id, 'contact', 'Fuente', 'fuente', 'single_select',
      '["Referido", "Web", "Evento", "Redes Sociales", "Email Marketing", "Otro"]'::jsonb, 0, true
    ) ON CONFLICT (organization_id, entity_type, property_key) DO NOTHING;
    
    -- Intereses
    INSERT INTO crm.entity_properties (
      organization_id, entity_type, property_name, property_key, property_type,
      options, display_order, is_visible
    ) VALUES (
      org_record.id, 'contact', 'Intereses', 'intereses', 'multi_select',
      '["Servicios Legales", "Firma Electrónica", "Notaría", "Consultoría", "Otros"]'::jsonb, 1, true
    ) ON CONFLICT (organization_id, entity_type, property_key) DO NOTHING;
  END LOOP;
END $$;

-- Propiedades para DEALS
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM core.organizations WHERE org_type = 'platform'
  LOOP
    -- Razón de Pérdida
    INSERT INTO crm.entity_properties (
      organization_id, entity_type, property_name, property_key, property_type,
      options, display_order, is_visible
    ) VALUES (
      org_record.id, 'deal', 'Razón de Pérdida', 'razon_perdida', 'single_select',
      '["Precio", "Competencia", "Timing", "Sin Presupuesto", "Otro"]'::jsonb, 0, true
    ) ON CONFLICT (organization_id, entity_type, property_key) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Migración y Seeding - Completado';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Acciones realizadas:';
  RAISE NOTICE '  ✅ Stages migrados de JSONB a tabla estructurada';
  RAISE NOTICE '  ✅ Pipelines por defecto creados:';
  RAISE NOTICE '     - Tickets: Soporte Técnico (5 etapas)';
  RAISE NOTICE '     - Contacts: Lifecycle (5 etapas)';
  RAISE NOTICE '     - Companies: B2B Journey (4 etapas)';
  RAISE NOTICE '  ✅ Propiedades por defecto creadas:';
  RAISE NOTICE '     - Tickets: 3 propiedades';
  RAISE NOTICE '     - Contacts: 2 propiedades';
  RAISE NOTICE '     - Deals: 1 propiedad';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Sistema listo para usar!';
  RAISE NOTICE '';
END $$;

