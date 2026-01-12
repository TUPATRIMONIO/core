-- =====================================================
-- Migration: Seed signing products prices in all currencies
-- Description: Define precios en todas las monedas para productos de firma existentes
-- Created: 2026-01-12
-- 
-- NOTA: Los precios están basados en equivalencia de poder adquisitivo,
-- no en tipo de cambio exacto. Deben ser revisados y ajustados según
-- estrategia comercial de cada país.
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- PRECIOS POR PRODUCTO Y MONEDA
-- =====================================================

-- FES (Firma Electrónica Simple): $6.990 CLP
UPDATE signing.products 
SET 
  price_usd = 7.50,   -- ~$7.50 USD
  price_clp = 6990,    -- $6.990 CLP (precio base)
  price_ars = 7500,    -- ~$7.500 ARS
  price_cop = 28000,  -- ~$28.000 COP
  price_mxn = 130,    -- ~$130 MXN
  price_pen = 28,     -- ~$28 PEN
  price_brl = 38,     -- ~$38 BRL
  updated_at = NOW()
WHERE slug = 'fes_cl';

-- FESB (Firma Electrónica Simple Biométrica): $7.990 CLP
UPDATE signing.products 
SET 
  price_usd = 8.50,
  price_clp = 7990,
  price_ars = 8500,
  price_cop = 32000,
  price_mxn = 150,
  price_pen = 32,
  price_brl = 43,
  updated_at = NOW()
WHERE slug = 'fesb_cl';

-- FES + ClaveÚnica: $7.990 CLP
UPDATE signing.products 
SET 
  price_usd = 8.50,
  price_clp = 7990,
  price_ars = 8500,
  price_cop = 32000,
  price_mxn = 150,
  price_pen = 32,
  price_brl = 43,
  updated_at = NOW()
WHERE slug = 'fes_claveunica_cl';

-- FEA (Firma Electrónica Avanzada): $8.990 CLP
UPDATE signing.products 
SET 
  price_usd = 9.50,
  price_clp = 8990,
  price_ars = 9500,
  price_cop = 36000,
  price_mxn = 170,
  price_pen = 36,
  price_brl = 48,
  updated_at = NOW()
WHERE slug = 'fea_cl';

-- Copia Certificada/Legalizada: $8.990 CLP (por documento)
UPDATE signing.products 
SET 
  price_usd = 9.50,
  price_clp = 8990,
  price_ars = 9500,
  price_cop = 36000,
  price_mxn = 170,
  price_pen = 36,
  price_brl = 48,
  updated_at = NOW()
WHERE slug = 'legalized_copy_cl';

-- Protocolización: $15.990 CLP (por documento)
UPDATE signing.products 
SET 
  price_usd = 17.00,
  price_clp = 15990,
  price_ars = 17000,
  price_cop = 64000,
  price_mxn = 300,
  price_pen = 64,
  price_brl = 85,
  updated_at = NOW()
WHERE slug = 'protocolization_cl';

-- FAN (Firma Autorizada ante Notario): $9.990 CLP (por firmante)
UPDATE signing.products 
SET 
  price_usd = 10.50,
  price_clp = 9990,
  price_ars = 10500,
  price_cop = 40000,
  price_mxn = 190,
  price_pen = 40,
  price_brl = 53,
  updated_at = NOW()
WHERE slug = 'notary_authorized_cl';

-- =====================================================
-- FUNCIÓN HELPER: Obtener precio localizado de un producto
-- =====================================================

CREATE OR REPLACE FUNCTION signing.get_product_price(
  product_slug_param TEXT,
  country_code_param TEXT
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_currency TEXT;
  v_price DECIMAL(10,2);
BEGIN
  -- Obtener moneda del país
  SELECT currency_code INTO v_currency
  FROM core.supported_countries
  WHERE country_code = UPPER(country_code_param)
    AND is_active = true;
  
  -- Si no se encuentra el país, usar USD como fallback
  IF v_currency IS NULL THEN
    v_currency := 'USD';
  END IF;
  
  -- Obtener precio según la moneda
  SELECT CASE UPPER(v_currency)
    WHEN 'USD' THEN price_usd
    WHEN 'CLP' THEN price_clp
    WHEN 'ARS' THEN price_ars
    WHEN 'COP' THEN price_cop
    WHEN 'MXN' THEN price_mxn
    WHEN 'PEN' THEN price_pen
    WHEN 'BRL' THEN price_brl
    ELSE price_usd -- Fallback a USD
  END INTO v_price
  FROM signing.products
  WHERE slug = product_slug_param
    AND is_active = true;
  
  RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.get_product_price(TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION signing.get_product_price IS 'Obtiene el precio de un producto en la moneda correspondiente al país. Retorna 0 si el producto no existe o no tiene precio definido.';

-- Crear función pública como wrapper para facilitar acceso desde el cliente
CREATE OR REPLACE FUNCTION public.get_product_price(
  product_slug_param TEXT,
  country_code_param TEXT
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN signing.get_product_price(product_slug_param, country_code_param);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_product_price(TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM signing.products 
  WHERE price_clp > 0;
  
  RAISE NOTICE '✅ Precios multi-moneda definidos para signing.products';
  RAISE NOTICE '   - % productos actualizados con precios en 7 monedas', updated_count;
  RAISE NOTICE '   - Monedas: USD, CLP, ARS, COP, MXN, PEN, BRL';
  RAISE NOTICE '   - Función get_product_price() creada';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTA: Los precios están basados en equivalencia aproximada.';
  RAISE NOTICE '   Revisar y ajustar según estrategia comercial de cada país.';
END $$;
