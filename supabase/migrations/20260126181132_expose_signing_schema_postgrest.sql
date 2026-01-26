-- Expose signing schema to PostgREST API
-- This needs to be run to make the signing schema accessible via the Supabase REST API

-- Verify current schemas exposed by PostgREST
DO $$
BEGIN
  RAISE NOTICE 'Current exposed schemas need to include: public, signing';
  RAISE NOTICE 'Go to Supabase Dashboard → Settings → API → Database Settings';
  RAISE NOTICE 'Add "signing" to the list of exposed schemas';
END $$;

-- Alternative: Update pgrst schema cache (may require Supabase restart)
NOTIFY pgrst, 'reload schema';

-- Verify the schema is accessible
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'signing', 'core', 'marketing', 'crm', 'credits', 'billing', 'communications')
ORDER BY schema_name;
