-- =====================================================
-- Migration: Fix saved signers security invoker
-- Description: Enable security_invoker on public.saved_signers view to enforce RLS
-- Created: 2026-02-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Recreate the view with security_invoker = true
CREATE OR REPLACE VIEW public.saved_signers
WITH (security_invoker = true) AS
SELECT * FROM signing.saved_signers;

-- Regrant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_signers TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Vista public.saved_signers actualizada con security_invoker = true';
  RAISE NOTICE '  - Ahora se respetan las políticas RLS de signing.saved_signers';
END $$;
