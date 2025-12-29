-- =====================================================
-- Migration: Add order_number to signing_documents_full
-- Description: Unir con billing.orders para mostrar el número de pedido
-- Created: 2025-12-29
-- =====================================================

SET search_path TO signing, billing, core, public, extensions;

-- Eliminar vista existente
DROP VIEW IF EXISTS public.signing_documents_full;

-- Recrear vista con la nueva columna
CREATE OR REPLACE VIEW public.signing_documents_full AS
SELECT 
  d.*,
  -- Order info
  ord.order_number,
  -- Signers count by status
  (SELECT COUNT(*) FROM signing.signers s WHERE s.document_id = d.id AND s.status != 'removed') AS active_signers_count,
  (SELECT COUNT(*) FROM signing.signers s WHERE s.document_id = d.id AND s.status = 'signed') AS signed_signers_count,
  (SELECT COUNT(*) FROM signing.signers s WHERE s.document_id = d.id AND s.status = 'pending') AS pending_signers_count,
  -- Reviewers count
  (SELECT COUNT(*) FROM signing.reviewers r WHERE r.document_id = d.id) AS reviewers_count,
  (SELECT COUNT(*) FROM signing.reviewers r WHERE r.document_id = d.id AND r.status = 'approved') AS approved_reviews_count,
  -- Latest version
  (SELECT v.file_path FROM signing.document_versions v WHERE v.document_id = d.id ORDER BY v.version_number DESC LIMIT 1) AS latest_version_path,
  -- Provider info
  p.name AS provider_name,
  p.slug AS provider_slug,
  -- Organization info
  o.name AS organization_name,
  o.slug AS organization_slug,
  -- Creator info
  u.full_name AS created_by_name
FROM signing.documents d
LEFT JOIN signing.providers p ON p.id = d.provider_id
LEFT JOIN core.organizations o ON o.id = d.organization_id
LEFT JOIN core.users u ON u.id = d.created_by
LEFT JOIN billing.orders ord ON ord.id = d.order_id;

GRANT SELECT ON public.signing_documents_full TO authenticated;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vista signing_documents_full actualizada con order_number';
END $$;
