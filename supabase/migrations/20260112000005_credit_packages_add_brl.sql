-- =====================================================
-- Migration: Add BRL pricing to credit packages
-- Description: Agrega columna price_brl y actualiza precios para Brasil
-- Created: 2026-01-12
-- =====================================================

SET search_path TO credits, core, public, extensions;

-- =====================================================
-- STEP 1: Agregar columna price_brl
-- =====================================================

ALTER TABLE credits.credit_packages 
  ADD COLUMN IF NOT EXISTS price_brl DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price_brl >= 0);

-- =====================================================
-- STEP 2: Actualizar precios en BRL para cada paquete
-- =====================================================

-- Paquete Básico (500 créditos, $9.99 USD)
UPDATE credits.credit_packages 
SET 
  price_brl = 58.00,  -- ~R$58 BRL (9.99 * 5.8)
  updated_at = NOW()
WHERE slug = 'basic';

-- Paquete Estándar (2000 créditos, $34.99 USD)
UPDATE credits.credit_packages 
SET 
  price_brl = 203.00,  -- ~R$203 BRL (34.99 * 5.8)
  updated_at = NOW()
WHERE slug = 'standard';

-- Paquete Profesional (5000 créditos, $79.99 USD)
UPDATE credits.credit_packages 
SET 
  price_brl = 464.00,  -- ~R$464 BRL (79.99 * 5.8)
  updated_at = NOW()
WHERE slug = 'professional';

-- Paquete Empresarial (15000 créditos, $199.99 USD)
UPDATE credits.credit_packages 
SET 
  price_brl = 1160.00,  -- ~R$1160 BRL (199.99 * 5.8)
  updated_at = NOW()
WHERE slug = 'enterprise';

-- Paquete Premium (50000 créditos, $599.99 USD)
UPDATE credits.credit_packages 
SET 
  price_brl = 3480.00,  -- ~R$3480 BRL (599.99 * 5.8)
  updated_at = NOW()
WHERE slug = 'premium';

-- =====================================================
-- STEP 3: Actualizar seed data para incluir price_brl
-- =====================================================

-- Actualizar el seed para que futuras ejecuciones incluyan BRL
INSERT INTO credits.credit_packages (
  name,
  slug,
  description,
  credits_amount,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  price_brl,
  is_active,
  sort_order
) VALUES
-- Paquete Básico
(
  'Paquete Básico',
  'basic',
  'Ideal para empezar - 500 créditos',
  500.00,
  9.99,
  9500.00,
  8500.00,
  42000.00,
  180.00,
  37.00,
  58.00,
  true,
  1
),
-- Paquete Estándar
(
  'Paquete Estándar',
  'standard',
  'Para uso regular - 2,000 créditos',
  2000.00,
  34.99,
  33250.00,
  29750.00,
  147000.00,
  630.00,
  130.00,
  203.00,
  true,
  2
),
-- Paquete Profesional
(
  'Paquete Profesional',
  'professional',
  'Para equipos - 5,000 créditos',
  5000.00,
  79.99,
  75950.00,
  67950.00,
  336000.00,
  1440.00,
  296.00,
  464.00,
  true,
  3
),
-- Paquete Empresarial
(
  'Paquete Empresarial',
  'enterprise',
  'Para empresas - 15,000 créditos',
  15000.00,
  199.99,
  189950.00,
  169950.00,
  840000.00,
  3600.00,
  740.00,
  1160.00,
  true,
  4
),
-- Paquete Premium
(
  'Paquete Premium',
  'premium',
  'Máximo valor - 50,000 créditos',
  50000.00,
  599.99,
  569950.00,
  509950.00,
  2520000.00,
  10800.00,
  2220.00,
  3480.00,
  true,
  5
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits_amount = EXCLUDED.credits_amount,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen,
  price_brl = EXCLUDED.price_brl,
  updated_at = NOW();

-- =====================================================
-- STEP 4: Recrear vista pública para incluir price_brl
-- =====================================================

CREATE OR REPLACE VIEW public.credit_packages AS
SELECT * FROM credits.credit_packages;

GRANT SELECT ON public.credit_packages TO anon, authenticated;
ALTER VIEW public.credit_packages SET (security_invoker = true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM credits.credit_packages 
  WHERE price_brl > 0 AND is_active = true;
  
  RAISE NOTICE '✅ Precio BRL agregado a credit_packages';
  RAISE NOTICE '   - Columna price_brl agregada';
  RAISE NOTICE '   - % paquetes actualizados con precios en BRL', updated_count;
  RAISE NOTICE '   - Vista pública recreada';
  RAISE NOTICE '';
  RAISE NOTICE 'Precios BRL configurados:';
  RAISE NOTICE '  ✅ Paquete Básico - R$58 BRL';
  RAISE NOTICE '  ✅ Paquete Estándar - R$203 BRL';
  RAISE NOTICE '  ✅ Paquete Profesional - R$464 BRL';
  RAISE NOTICE '  ✅ Paquete Empresarial - R$1.160 BRL';
  RAISE NOTICE '  ✅ Paquete Premium - R$3.480 BRL';
END $$;
