-- =====================================================
-- Migration: Fix CDS Configuration and Webhook
-- Description: Corrige el Organization ID y actualiza el Webhook URL
--              para el entorno de producción (tsefchkedlkwhiexqbrs)
-- Created: 2025-12-17
-- =====================================================

DO $$
DECLARE
    v_provider_id UUID;
    v_correct_org_id UUID := 'e19c3aa5-654e-4d83-8e79-151e13925588'::UUID;
    v_project_ref TEXT := 'tsefchkedlkwhiexqbrs';
BEGIN
    -- Obtener ID del proveedor CDS
    SELECT id INTO v_provider_id FROM signing.providers WHERE slug = 'cds';

    IF v_provider_id IS NOT NULL THEN
        -- 1. Corregir Organization ID
        -- Si existe una configuración de CDS apuntando a otra empresa, moverla a la correcta
        -- (Asumiendo que es la configuración que se creó por defecto en el seed)
        UPDATE signing.provider_configs
        SET organization_id = v_correct_org_id
        WHERE provider_id = v_provider_id
          AND organization_id != v_correct_org_id;

        -- 2. Actualizar Webhook URL
        -- Establecer la URL correcta de la Edge Function desplegada
        UPDATE signing.provider_configs
        SET webhook_url = format('https://%s.supabase.co/functions/v1/signature-webhook', v_project_ref)
        WHERE provider_id = v_provider_id
          AND organization_id = v_correct_org_id;

        RAISE NOTICE '✅ Configuración CDS actualizada para Org: % | Webhook: https://%s.supabase.co/functions/v1/signature-webhook', v_correct_org_id, v_project_ref;
    ELSE
        RAISE WARNING '⚠️ Proveedor CDS no encontrado. No se aplicaron cambios.';
    END IF;
END $$;
