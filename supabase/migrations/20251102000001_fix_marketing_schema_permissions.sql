-- Migration: Fix Marketing Schema Permissions for Service Role
-- Description: Otorgar permisos completos al service_role sobre el schema marketing
-- Created: 2025-11-02

-- Otorgar permisos de uso del schema marketing
GRANT USAGE ON SCHEMA marketing TO service_role, postgres;

-- Otorgar permisos sobre TODAS las tablas existentes en marketing
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA marketing TO service_role, postgres;

-- Otorgar permisos sobre TODAS las secuencias en marketing
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA marketing TO service_role, postgres;

-- Otorgar permisos sobre TODAS las funciones en marketing
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA marketing TO service_role, postgres;

-- Configurar permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA marketing 
GRANT ALL ON TABLES TO service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA marketing 
GRANT ALL ON SEQUENCES TO service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA marketing 
GRANT EXECUTE ON FUNCTIONS TO service_role, postgres;

-- Comentario
COMMENT ON SCHEMA marketing IS 'Schema de marketing con permisos completos para service_role';

