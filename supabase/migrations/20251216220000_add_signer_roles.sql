-- =====================================================
-- Migration: Add signer roles support
-- Description: Adds role field to signers table (signer, approver, reviewer)
-- Created: 2025-12-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- ENUM: Signer Role
-- =====================================================

CREATE TYPE signing.signer_role AS ENUM (
  'signer',    -- Firmante (debe firmar)
  'approver',  -- Aprobador (aprueba antes de firmar)
  'reviewer'   -- Revisor (revisa pero no firma)
);

-- =====================================================
-- ADD COLUMN: role to signers
-- =====================================================

ALTER TABLE signing.signers
ADD COLUMN role signing.signer_role NOT NULL DEFAULT 'signer';

-- =====================================================
-- INDEX
-- =====================================================

CREATE INDEX idx_signers_role ON signing.signers(document_id, role);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN signing.signers.role IS 'Rol del participante: signer (firmante), approver (aprobador), reviewer (revisor)';

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Roles de firmantes agregados';
  RAISE NOTICE '  - signer: Firmante (debe firmar)';
  RAISE NOTICE '  - approver: Aprobador (aprueba antes de firmar)';
  RAISE NOTICE '  - reviewer: Revisor (revisa pero no firma)';
END $$;
