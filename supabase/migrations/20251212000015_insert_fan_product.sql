-- =====================================================
-- Migration: Insert FAN product
-- Description: Inserta producto FAN ahora que el enum value existe
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Insertar producto FAN
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
) VALUES
  (
    'fan_cl',
    'Firma Autorizada por Notario (FAN®)',
    'El notario autoriza la firma electrónica otorgándole plena validez legal. Requiere FES+ClaveÚnica o FEA.',
    'notary_service',
    'CL',
    0,
    'CLP',
    'per_document',
    'rut_only',
    'notary_authorized',
    30
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  base_price = EXCLUDED.base_price,
  currency = EXCLUDED.currency,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  notary_service = EXCLUDED.notary_service,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = NOW();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Servicio FAN (Firma Autorizada por Notario) agregado al catálogo';
END $$;

