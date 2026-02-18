-- =====================================================
-- Migration: Refresh signing_signers view for ClaveÚnica
-- Description: Recrea la vista para incluir columnas de ClaveÚnica
-- Created: 2026-02-18
-- =====================================================

SET search_path TO signing, public, extensions;

-- Recrear la vista para que incluya las nuevas columnas de ClaveÚnica
DROP VIEW IF EXISTS public.signing_signers CASCADE;

CREATE VIEW public.signing_signers AS
SELECT * FROM signing.signers;

-- Permisos
GRANT SELECT, INSERT, UPDATE ON public.signing_signers TO authenticated;

-- security_invoker para que respete RLS
ALTER VIEW public.signing_signers SET (security_invoker = true);

-- Recrear también signing_signers_ordered
DROP VIEW IF EXISTS public.signing_signers_ordered CASCADE;

CREATE VIEW public.signing_signers_ordered AS
SELECT
  s.*,
  d.title AS document_title,
  d.status AS document_status,
  d.signing_order AS document_signing_order,
  CASE
    WHEN d.signing_order = 'sequential' THEN (
      SELECT COUNT(*) + 1
      FROM signing.signers prev
      WHERE prev.document_id = s.document_id
        AND prev.status = 'signed'
        AND prev.signing_order < s.signing_order
    )
    ELSE NULL
  END AS current_turn
FROM signing.signers s
JOIN signing.documents d ON d.id = s.document_id
ORDER BY s.signing_order;

GRANT SELECT ON public.signing_signers_ordered TO authenticated;
ALTER VIEW public.signing_signers_ordered SET (security_invoker = true);
