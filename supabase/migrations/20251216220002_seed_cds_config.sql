-- =====================================================
-- Migration: Seed CDS Configuration (Placeholders)
-- Description: Inserta configuración inicial de CDS con valores temporales
--              para que el usuario los actualice manualmente en el Dashboard.
-- Created: 2025-12-16
-- =====================================================

DO $$
DECLARE
    v_org_id UUID;
    v_provider_id UUID;
BEGIN
    -- 1. Buscar el proveedor CDS
    SELECT id INTO v_provider_id FROM signing.providers WHERE slug = 'cds';

    -- 2. Buscar tu organización
    -- INTENTA buscar 'TuPatrimonio' o toma la primera que encuentre
    SELECT id INTO v_org_id FROM core.organizations 
    WHERE name ILIKE '%TuPatrimonio%' 
    ORDER BY created_at ASC 
    LIMIT 1;

    -- Si no encuentra por nombre, toma la primera disponible (fallback)
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM core.organizations LIMIT 1;
    END IF;

    -- 3. Insertar configuración si existen ambos IDs
    IF v_org_id IS NOT NULL AND v_provider_id IS NOT NULL THEN
        
        RAISE NOTICE 'Insertando configuración CDS para Org ID: %', v_org_id;

        INSERT INTO signing.provider_configs (
            organization_id,
            provider_id,
            credentials,
            config,
            webhook_url,
            webhook_secret,
            is_active,
            is_test_mode
        ) VALUES (
            v_org_id,
            v_provider_id,
            jsonb_build_object(
                'usuario', 'CAMBIAR_POR_USUARIO_REAL',
                'clave', 'CAMBIAR_POR_CLAVE_REAL'
            ),
            '{}'::jsonb,
            'https://TU_PROYECTO.supabase.co/functions/v1/signature-webhook',
            'CAMBIAR_POR_SECRETO_REAL',
            true, -- Activo
            true  -- Modo Test (true = URLs de test2.certificadoradelsur.cl)
        )
        ON CONFLICT (organization_id, provider_id) 
        DO UPDATE SET
            updated_at = NOW(); -- Si ya existe, solo actualizamos el timestamp para no sobrescribir datos reales si ya los pusiste
            
    ELSE
        RAISE NOTICE '⚠️ No se pudo insertar configuración: Falta Organización o Proveedor CDS';
    END IF;
END $$;
