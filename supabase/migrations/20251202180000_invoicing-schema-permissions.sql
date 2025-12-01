-- =====================================================
-- Migration: Invoicing Schema Permissions
-- Description: Otorga permisos necesarios al schema invoicing para service_role y authenticated
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- SCHEMA PERMISSIONS
-- =====================================================

-- Grant USAGE on schema to service_role and authenticated
GRANT USAGE ON SCHEMA invoicing TO service_role;
GRANT USAGE ON SCHEMA invoicing TO authenticated;

-- =====================================================
-- TABLE PERMISSIONS
-- =====================================================

-- Grant ALL permissions on all tables to service_role (for server-side operations)
GRANT ALL ON ALL TABLES IN SCHEMA invoicing TO service_role;

-- Grant SELECT, INSERT, UPDATE permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA invoicing TO authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA invoicing TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA invoicing TO authenticated;

-- =====================================================
-- FUNCTION PERMISSIONS
-- =====================================================

-- Grant EXECUTE on all functions to service_role and authenticated
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA invoicing TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA invoicing TO authenticated;

-- =====================================================
-- FUTURE PERMISSIONS (for new tables/functions created later)
-- =====================================================

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA invoicing 
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoicing 
  GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;

-- Set default permissions for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA invoicing 
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoicing 
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- Set default permissions for future functions
ALTER DEFAULT PRIVILEGES IN SCHEMA invoicing 
  GRANT EXECUTE ON FUNCTIONS TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA invoicing 
  GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Permisos otorgados en schema invoicing';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos otorgados:';
  RAISE NOTICE '  ✅ USAGE en schema invoicing para service_role y authenticated';
  RAISE NOTICE '  ✅ ALL en tablas para service_role';
  RAISE NOTICE '  ✅ SELECT, INSERT, UPDATE en tablas para authenticated';
  RAISE NOTICE '  ✅ EXECUTE en funciones para service_role y authenticated';
  RAISE NOTICE '  ✅ Permisos por defecto configurados para objetos futuros';
END $$;

