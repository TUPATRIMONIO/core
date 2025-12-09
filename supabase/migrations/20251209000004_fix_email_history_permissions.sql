-- =====================================================
-- Migration: Fix email_history permissions
-- Description: Corrige permisos para que service_role pueda insertar en email_history
-- Created: 2025-12-09
-- =====================================================

SET search_path TO communications, core, public, extensions;

-- Otorgar permisos al schema communications para service_role
GRANT USAGE ON SCHEMA communications TO service_role;
GRANT ALL ON SCHEMA communications TO service_role;

-- Otorgar permisos específicos en la tabla email_history
GRANT SELECT, INSERT, UPDATE ON communications.email_history TO service_role;

-- También otorgar permisos en la vista pública si es necesario
GRANT SELECT ON public.email_history TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Permisos de communications.email_history corregidos para service_role';
END $$;

