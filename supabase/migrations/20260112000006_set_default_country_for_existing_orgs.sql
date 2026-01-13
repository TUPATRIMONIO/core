-- =====================================================
-- Migration: Set default country for existing organizations
-- Description: Establece 'CL' (Chile) como país default para organizaciones sin país configurado
-- Created: 2026-01-12
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- Actualizar organizaciones sin país
-- =====================================================

-- Establecer Chile como país default para organizaciones que no tienen país configurado
UPDATE core.organizations
SET 
  country = 'CL',
  updated_at = NOW()
WHERE country IS NULL OR country = '';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Contar cuántas organizaciones ahora tienen país configurado
  SELECT COUNT(*) INTO updated_count 
  FROM core.organizations 
  WHERE country IS NOT NULL AND country != '';
  
  RAISE NOTICE '✅ País default establecido para organizaciones';
  RAISE NOTICE '   - % organizaciones con país configurado', updated_count;
  RAISE NOTICE '   - Default: CL (Chile)';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  Los usuarios pueden cambiar su país desde /billing/settings';
END $$;
