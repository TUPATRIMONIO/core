-- =====================================================
-- Migration: Create public views for identity_verifications
-- Description: Vistas públicas para acceso desde frontend (Supabase client)
-- Created: 2026-02-05
-- =====================================================

SET search_path TO public, identity_verifications, core, extensions;

-- =====================================================
-- VISTAS PÚBLICAS (con RLS aplicado)
-- =====================================================

-- Vista: Proveedores
CREATE OR REPLACE VIEW public.identity_verification_providers
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.providers;

-- Vista: Configuraciones de proveedor
CREATE OR REPLACE VIEW public.identity_verification_provider_configs
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.provider_configs;

-- Vista: Sesiones de verificación
CREATE OR REPLACE VIEW public.identity_verification_sessions
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.verification_sessions;

-- Vista: Intentos
CREATE OR REPLACE VIEW public.identity_verification_attempts
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.verification_attempts;

-- Vista: Documentos
CREATE OR REPLACE VIEW public.identity_verification_documents
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.verification_documents;

-- Vista: Media
CREATE OR REPLACE VIEW public.identity_verification_media
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.verification_media;

-- Vista: Audit log
CREATE OR REPLACE VIEW public.identity_verification_audit_log
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.audit_log;

-- =====================================================
-- GRANTS A LAS VISTAS
-- =====================================================

GRANT SELECT ON public.identity_verification_providers TO authenticated;
GRANT SELECT ON public.identity_verification_provider_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.identity_verification_sessions TO authenticated;
GRANT SELECT, INSERT ON public.identity_verification_attempts TO authenticated;
GRANT SELECT ON public.identity_verification_documents TO authenticated;
GRANT SELECT ON public.identity_verification_media TO authenticated;
GRANT SELECT ON public.identity_verification_audit_log TO authenticated;

-- Service role acceso total
GRANT ALL ON public.identity_verification_providers TO service_role;
GRANT ALL ON public.identity_verification_provider_configs TO service_role;
GRANT ALL ON public.identity_verification_sessions TO service_role;
GRANT ALL ON public.identity_verification_attempts TO service_role;
GRANT ALL ON public.identity_verification_documents TO service_role;
GRANT ALL ON public.identity_verification_media TO service_role;
GRANT ALL ON public.identity_verification_audit_log TO service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW public.identity_verification_sessions IS 
  'Vista pública de sesiones de verificación (RLS aplicado via security_invoker)';

COMMENT ON VIEW public.identity_verification_media IS 
  'Vista pública de archivos multimedia (RLS aplicado via security_invoker)';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas públicas creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas disponibles desde frontend:';
  RAISE NOTICE '  - public.identity_verification_providers';
  RAISE NOTICE '  - public.identity_verification_provider_configs';
  RAISE NOTICE '  - public.identity_verification_sessions';
  RAISE NOTICE '  - public.identity_verification_attempts';
  RAISE NOTICE '  - public.identity_verification_documents';
  RAISE NOTICE '  - public.identity_verification_media';
  RAISE NOTICE '  - public.identity_verification_audit_log';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 RLS se aplica automáticamente (security_invoker = true)';
END $$;
