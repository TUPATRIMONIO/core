-- =====================================================
-- Migration: Update CDS Endpoints
-- Description: Ensures the 'cds' provider has the 'flujoSimpleFEA' endpoint configured.
-- Created: 2025-12-17
-- =====================================================

UPDATE signing.providers
SET endpoints = endpoints || jsonb_build_object(
    'flujoSimpleFEA', '/firmaIntegracionFEA/flujoSimpleFEA'
)
WHERE slug = 'cds';
