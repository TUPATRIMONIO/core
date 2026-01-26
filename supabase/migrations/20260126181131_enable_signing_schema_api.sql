-- Enable signing schema for API access
-- This migration configures the signing schema to be accessible via Supabase API

-- Ensure the signing schema exists
CREATE SCHEMA IF NOT EXISTS signing;

-- Grant usage on schema to API roles
GRANT USAGE ON SCHEMA signing TO anon, authenticated, service_role;

-- Grant permissions on all existing tables in signing schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA signing TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA signing TO service_role;

-- Grant permissions on all existing sequences in signing schema
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA signing TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA signing TO service_role;

-- Set default privileges for future tables in signing schema
ALTER DEFAULT PRIVILEGES IN SCHEMA signing GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA signing GRANT ALL ON TABLES TO service_role;

-- Set default privileges for future sequences in signing schema
ALTER DEFAULT PRIVILEGES IN SCHEMA signing GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA signing GRANT ALL ON SEQUENCES TO service_role;

-- Comment for documentation
COMMENT ON SCHEMA signing IS 'Schema for electronic signing and notary services - exposed via Supabase API';
