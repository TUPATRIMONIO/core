-- Migration: Verificar y completar políticas RLS
-- Description: Verifica que todas las tablas tengan RLS habilitado y las políticas correctas
-- Created: 2025-11-19

-- =====================================================
-- FUNCIÓN HELPER: Verificar RLS
-- =====================================================

CREATE OR REPLACE FUNCTION verify_rls_status()
RETURNS TABLE(
  schema_name text,
  table_name text,
  rls_enabled boolean,
  policies_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::text as schema_name,
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    COUNT(p.polname) as policies_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE n.nspname IN ('core', 'signatures', 'notary', 'crm')
    AND c.relkind = 'r'
  GROUP BY n.nspname, c.relname, c.relrowsecurity
  ORDER BY n.nspname, c.relname;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ASEGURAR RLS EN TODAS LAS TABLAS
-- =====================================================

-- Core schema
ALTER TABLE IF EXISTS core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.organization_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.credit_package_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core.currencies ENABLE ROW LEVEL SECURITY;

-- Signatures schema
ALTER TABLE IF EXISTS signatures.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signatures.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signatures.document_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signatures.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signatures.document_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signatures.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signatures.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Notary schema
ALTER TABLE IF EXISTS notary.notaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notary.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notary.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notary.request_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS ADICIONALES PARA TABLAS PÚBLICAS
-- =====================================================

-- Currencies: Todos pueden leer
DROP POLICY IF EXISTS "Anyone can view currencies" ON core.currencies;
CREATE POLICY "Anyone can view currencies"
ON core.currencies FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Credit packages: Todos pueden leer los activos
DROP POLICY IF EXISTS "Anyone can view active packages" ON core.credit_packages;
CREATE POLICY "Anyone can view active packages"
ON core.credit_packages FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Credit package prices: Todos pueden leer
DROP POLICY IF EXISTS "Anyone can view package prices" ON core.credit_package_prices;
CREATE POLICY "Anyone can view package prices"
ON core.credit_package_prices FOR SELECT
TO authenticated, anon
USING (true);

-- Payment providers: Todos pueden leer los activos
DROP POLICY IF EXISTS "Anyone can view active payment providers" ON core.payment_providers;
CREATE POLICY "Anyone can view active payment providers"
ON core.payment_providers FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Products: Todos pueden leer los activos
DROP POLICY IF EXISTS "Anyone can view active products" ON core.products;
CREATE POLICY "Anyone can view active products"
ON core.products FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Product prices: Todos pueden leer
DROP POLICY IF EXISTS "Anyone can view product prices" ON core.product_prices;
CREATE POLICY "Anyone can view product prices"
ON core.product_prices FOR SELECT
TO authenticated, anon
USING (true);

-- Roles: Usuarios autenticados pueden leer
DROP POLICY IF EXISTS "Authenticated users can view roles" ON core.roles;
CREATE POLICY "Authenticated users can view roles"
ON core.roles FOR SELECT
TO authenticated
USING (true);

-- Signature providers: Usuarios autenticados pueden leer activos
DROP POLICY IF EXISTS "Authenticated users can view active providers" ON signatures.providers;
CREATE POLICY "Authenticated users can view active providers"
ON signatures.providers FOR SELECT
TO authenticated
USING (is_active = true);

-- Notary service types: Todos pueden leer activos
DROP POLICY IF EXISTS "Anyone can view active service types" ON notary.service_types;
CREATE POLICY "Anyone can view active service types"
ON notary.service_types FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
  rls_check RECORD;
  total_tables INT := 0;
  tables_with_rls INT := 0;
  tables_without_policies INT := 0;
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VERIFICACIÓN DE RLS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';

  FOR rls_check IN 
    SELECT * FROM verify_rls_status()
  LOOP
    total_tables := total_tables + 1;
    
    IF rls_check.rls_enabled THEN
      tables_with_rls := tables_with_rls + 1;
    END IF;

    IF rls_check.policies_count = 0 THEN
      tables_without_policies := tables_without_policies + 1;
      RAISE WARNING '⚠️  %.%: RLS habilitado pero SIN políticas', 
        rls_check.schema_name, rls_check.table_name;
    ELSE
      RAISE NOTICE '✅ %.%: RLS habilitado, % política(s)', 
        rls_check.schema_name, rls_check.table_name, rls_check.policies_count;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RESUMEN';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total de tablas: %', total_tables;
  RAISE NOTICE 'Tablas con RLS: %', tables_with_rls;
  RAISE NOTICE 'Tablas sin políticas: %', tables_without_policies;
  RAISE NOTICE '';

  IF tables_without_policies > 0 THEN
    RAISE WARNING 'Hay % tabla(s) sin políticas RLS', tables_without_policies;
  ELSE
    RAISE NOTICE '✅ Todas las tablas tienen políticas RLS configuradas';
  END IF;
END $$;

