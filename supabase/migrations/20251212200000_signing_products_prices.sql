-- =====================================================
-- Migration: Update signing products prices (Chile)
-- Description: Actualiza precios reales para productos de firma
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- Actualizar precios de tipos de firma (por firmante)
-- =====================================================

-- FES: $6.990 CLP
UPDATE signing.products 
SET base_price = 6990, updated_at = NOW()
WHERE slug = 'fes_cl';

-- FESB: $7.990 CLP
UPDATE signing.products 
SET base_price = 7990, updated_at = NOW()
WHERE slug = 'fesb_cl';

-- FES + ClaveÚnica: $7.990 CLP
UPDATE signing.products 
SET base_price = 7990, updated_at = NOW()
WHERE slug = 'fes_claveunica_cl';

-- FEA: $8.990 CLP
UPDATE signing.products 
SET base_price = 8990, updated_at = NOW()
WHERE slug = 'fea_cl';

-- =====================================================
-- Actualizar precios de servicios notariales (por documento)
-- =====================================================

-- Copia Certificada/Legalizada: $8.990 CLP
UPDATE signing.products 
SET base_price = 8990, updated_at = NOW()
WHERE slug = 'legalized_copy_cl';

-- Protocolización: $15.990 CLP
UPDATE signing.products 
SET base_price = 15990, updated_at = NOW()
WHERE slug = 'protocolization_cl';

-- =====================================================
-- Agregar servicio FAN (Firma Autorizada ante Notario)
-- =====================================================

INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  base_price,
  currency,
  billing_unit,
  identifier_type,
  notary_service,
  display_order
) VALUES (
  'notary_authorized_cl',
  'Firma Autorizada ante Notario (FAN®)',
  'Firma electrónica autorizada ante notario. Requiere FES+ClaveÚnica o FEA.',
  'notary_service',
  'CL',
  9990,
  'CLP',
  'per_signer',
  'rut_only',
  'notary_authorized',
  30
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  notary_service = EXCLUDED.notary_service,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = NOW();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Precios de signing.products actualizados (CL)';
  RAISE NOTICE '   - FES: $6.990';
  RAISE NOTICE '   - FESB: $7.990';
  RAISE NOTICE '   - FES+ClaveÚnica: $7.990';
  RAISE NOTICE '   - FEA: $8.990';
  RAISE NOTICE '   - Copia Certificada: $8.990';
  RAISE NOTICE '   - Protocolización: $15.990';
  RAISE NOTICE '   - FAN: $9.990';
END $$;
