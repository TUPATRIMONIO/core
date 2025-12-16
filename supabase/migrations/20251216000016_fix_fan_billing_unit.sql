-- =====================================================
-- Migration: Fix FAN billing unit
-- Description: Corrige la unidad de facturación de FAN a per_signer
-- Created: 2025-12-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- Corregir billing_unit del producto FAN
-- FAN se cobra por firmante, no por documento
-- =====================================================

UPDATE signing.products 
SET 
  billing_unit = 'per_signer',
  updated_at = NOW()
WHERE slug = 'fan_cl';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Producto FAN (fan_cl) actualizado: billing_unit = per_signer';
END $$;
