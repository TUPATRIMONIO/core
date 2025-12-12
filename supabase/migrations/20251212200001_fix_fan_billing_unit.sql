-- =====================================================
-- Migration: Fix FAN billing unit
-- Description: FAN debe cobrar por firma, no por documento
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

UPDATE signing.products 
SET billing_unit = 'per_signer', updated_at = NOW()
WHERE slug = 'notary_authorized_cl';

DO $$
BEGIN
  RAISE NOTICE '✅ FAN actualizado a per_signer';
END $$;
