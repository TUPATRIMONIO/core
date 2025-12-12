-- =====================================================
-- Migration: Expose notary system views
-- Description: Crea vistas públicas para notary_offices/services/assignments
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, public, extensions;

CREATE OR REPLACE VIEW public.signing_notary_offices AS
SELECT * FROM signing.notary_offices;

CREATE OR REPLACE VIEW public.signing_notary_services AS
SELECT * FROM signing.notary_services;

CREATE OR REPLACE VIEW public.signing_notary_assignments AS
SELECT * FROM signing.notary_assignments;

GRANT SELECT ON public.signing_notary_offices TO authenticated;
GRANT SELECT ON public.signing_notary_services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.signing_notary_assignments TO authenticated;

ALTER VIEW public.signing_notary_offices SET (security_invoker = true);
ALTER VIEW public.signing_notary_services SET (security_invoker = true);
ALTER VIEW public.signing_notary_assignments SET (security_invoker = true);

DO $$
BEGIN
  RAISE NOTICE '✅ Vistas de notaría expuestas en public.*';
END $$;

