-- =====================================================
-- Migration: FESB disponible para todos los países
-- Description: Inserta FESB (Firma Electrónica Simple Biométrica) para AR, CO, MX, PE, BR, US
-- Created: 2026-01-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- INSERT FESB para todos los países soportados
-- =====================================================

-- FESB Argentina
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  billing_unit,
  identifier_type,
  display_order,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  price_brl
) VALUES (
  'fesb_ar',
  'Firma Electrónica Simple Biométrica (FESB)',
  'Firma simple biométrica (multi-país). Puede usar distintos identificadores.',
  'signature_type',
  'AR',
  'per_signer',
  'any',
  40,
  8.50,
  7990,
  8500,
  32000,
  150,
  32,
  43
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  display_order = EXCLUDED.display_order,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen,
  price_brl = EXCLUDED.price_brl,
  is_active = true,
  updated_at = NOW();

-- FESB Colombia
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  billing_unit,
  identifier_type,
  display_order,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  price_brl
) VALUES (
  'fesb_co',
  'Firma Electrónica Simple Biométrica (FESB)',
  'Firma simple biométrica (multi-país). Puede usar distintos identificadores.',
  'signature_type',
  'CO',
  'per_signer',
  'any',
  40,
  8.50,
  7990,
  8500,
  32000,
  150,
  32,
  43
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  display_order = EXCLUDED.display_order,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen,
  price_brl = EXCLUDED.price_brl,
  is_active = true,
  updated_at = NOW();

-- FESB México
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  billing_unit,
  identifier_type,
  display_order,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  price_brl
) VALUES (
  'fesb_mx',
  'Firma Electrónica Simple Biométrica (FESB)',
  'Firma simple biométrica (multi-país). Puede usar distintos identificadores.',
  'signature_type',
  'MX',
  'per_signer',
  'any',
  40,
  8.50,
  7990,
  8500,
  32000,
  150,
  32,
  43
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  display_order = EXCLUDED.display_order,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen,
  price_brl = EXCLUDED.price_brl,
  is_active = true,
  updated_at = NOW();

-- FESB Perú
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  billing_unit,
  identifier_type,
  display_order,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  price_brl
) VALUES (
  'fesb_pe',
  'Firma Electrónica Simple Biométrica (FESB)',
  'Firma simple biométrica (multi-país). Puede usar distintos identificadores.',
  'signature_type',
  'PE',
  'per_signer',
  'any',
  40,
  8.50,
  7990,
  8500,
  32000,
  150,
  32,
  43
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  display_order = EXCLUDED.display_order,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen,
  price_brl = EXCLUDED.price_brl,
  is_active = true,
  updated_at = NOW();

-- FESB Brasil
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  billing_unit,
  identifier_type,
  display_order,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  price_brl
) VALUES (
  'fesb_br',
  'Firma Electrónica Simple Biométrica (FESB)',
  'Firma simple biométrica (multi-país). Puede usar distintos identificadores.',
  'signature_type',
  'BR',
  'per_signer',
  'any',
  40,
  8.50,
  7990,
  8500,
  32000,
  150,
  32,
  43
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  display_order = EXCLUDED.display_order,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen,
  price_brl = EXCLUDED.price_brl,
  is_active = true,
  updated_at = NOW();

-- FESB Estados Unidos
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  billing_unit,
  identifier_type,
  display_order,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  price_brl
) VALUES (
  'fesb_us',
  'Firma Electrónica Simple Biométrica (FESB)',
  'Firma simple biométrica (multi-país). Puede usar distintos identificadores.',
  'signature_type',
  'US',
  'per_signer',
  'any',
  40,
  8.50,
  7990,
  8500,
  32000,
  150,
  32,
  43
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  display_order = EXCLUDED.display_order,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen,
  price_brl = EXCLUDED.price_brl,
  is_active = true,
  updated_at = NOW();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  fesb_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fesb_count 
  FROM signing.products 
  WHERE slug LIKE 'fesb_%' AND is_active = true;
  
  RAISE NOTICE '✅ FESB disponible para todos los países';
  RAISE NOTICE '   - % registros de FESB activos', fesb_count;
  RAISE NOTICE '   - Países: CL, AR, CO, MX, PE, BR, US';
  RAISE NOTICE '   - Precios multi-moneda configurados para todos';
END $$;
