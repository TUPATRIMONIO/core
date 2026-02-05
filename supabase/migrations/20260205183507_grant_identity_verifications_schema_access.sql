-- =====================================================
-- Migration: Grant schema access for identity_verifications
-- Description: Otorga permisos de USAGE en el schema identity_verifications
--              a service_role y authenticated para que las vistas públicas
--              con security_invoker=true puedan acceder a las tablas subyacentes
-- Created: 2026-02-05
-- =====================================================

-- Permisos de schema
GRANT USAGE ON SCHEMA identity_verifications TO service_role;
GRANT USAGE ON SCHEMA identity_verifications TO authenticated;

-- Permisos en tablas para service_role (acceso completo)
GRANT ALL ON ALL TABLES IN SCHEMA identity_verifications TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA identity_verifications TO service_role;

-- Permisos en tablas para authenticated (lectura + insert limitado)
GRANT SELECT ON ALL TABLES IN SCHEMA identity_verifications TO authenticated;
GRANT INSERT ON identity_verifications.verification_sessions TO authenticated;
GRANT INSERT ON identity_verifications.verification_attempts TO authenticated;
GRANT UPDATE ON identity_verifications.verification_sessions TO authenticated;

-- Permisos para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA identity_verifications
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA identity_verifications
  GRANT ALL ON SEQUENCES TO service_role;
