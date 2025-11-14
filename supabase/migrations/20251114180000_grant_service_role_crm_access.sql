/**
 * Grant permissions to service_role for CRM schema
 * Necesario para que los callbacks de OAuth funcionen con Service Role
 */

-- Otorgar permisos al service_role sobre el schema crm
GRANT USAGE ON SCHEMA crm TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA crm TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA crm TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA crm TO service_role;

-- Asegurar que futuros objetos también tengan permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL ON FUNCTIONS TO service_role;

COMMENT ON SCHEMA crm IS 'CRM schema with service_role access for OAuth callbacks';

