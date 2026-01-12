-- =====================================================
-- Migration: Migrate signing.products to multi-currency pricing
-- Description: Agrega columnas de precio por moneda y migra datos existentes
-- Created: 2026-01-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- STEP 1: Agregar columnas de precio por moneda
-- =====================================================

ALTER TABLE signing.products 
  ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_usd >= 0),
  ADD COLUMN IF NOT EXISTS price_clp DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_clp >= 0),
  ADD COLUMN IF NOT EXISTS price_ars DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_ars >= 0),
  ADD COLUMN IF NOT EXISTS price_cop DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_cop >= 0),
  ADD COLUMN IF NOT EXISTS price_mxn DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_mxn >= 0),
  ADD COLUMN IF NOT EXISTS price_pen DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_pen >= 0),
  ADD COLUMN IF NOT EXISTS price_brl DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_brl >= 0);

-- =====================================================
-- STEP 2: Migrar datos existentes de base_price → price_clp
-- =====================================================

-- Todos los productos existentes tienen currency = 'CLP', así que migramos base_price a price_clp
UPDATE signing.products 
SET price_clp = base_price 
WHERE base_price > 0 AND currency = 'CLP';

-- =====================================================
-- STEP 3: Eliminar columnas antiguas (base_price, currency) con CASCADE
-- =====================================================

-- Usamos CASCADE para eliminar automáticamente la vista que depende de estas columnas
-- La vista public.signing_products será eliminada automáticamente

ALTER TABLE signing.products 
  DROP COLUMN IF EXISTS base_price CASCADE,
  DROP COLUMN IF EXISTS currency CASCADE;

-- =====================================================
-- STEP 4: Recrear vista pública con las nuevas columnas
-- =====================================================

-- Recrear la vista pública que fue eliminada por el CASCADE
-- Ahora incluirá las nuevas columnas price_* automáticamente

CREATE OR REPLACE VIEW public.signing_products AS
SELECT * FROM signing.products;

GRANT SELECT ON public.signing_products TO anon, authenticated;
ALTER VIEW public.signing_products SET (security_invoker = true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count 
  FROM signing.products 
  WHERE price_clp > 0;
  
  RAISE NOTICE '✅ signing.products migrado a precios multi-moneda';
  RAISE NOTICE '   - Columnas agregadas: price_usd, price_clp, price_ars, price_cop, price_mxn, price_pen, price_brl';
  RAISE NOTICE '   - % productos migrados (base_price → price_clp)', migrated_count;
  RAISE NOTICE '   - Columnas eliminadas: base_price, currency';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Ejecutar la siguiente migración para definir precios en todas las monedas';
END $$;
