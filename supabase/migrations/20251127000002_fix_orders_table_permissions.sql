-- =====================================================
-- Migration: Fix orders table permissions
-- Description: Otorga permisos faltantes en billing.orders
-- Created: 2025-11-27
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- GRANT PERMISSIONS ON ORDERS TABLE
-- =====================================================

-- Grant permissions to authenticated users on the table itself
GRANT SELECT, INSERT, UPDATE ON billing.orders TO authenticated;

-- Ensure USAGE permission on billing schema (might already exist)
GRANT USAGE ON SCHEMA billing TO authenticated;

-- Grant sequences permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA billing TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Permisos otorgados en billing.orders';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos otorgados:';
  RAISE NOTICE '  ✅ SELECT, INSERT, UPDATE en billing.orders para authenticated';
  RAISE NOTICE '  ✅ USAGE en schema billing para authenticated';
END $$;

