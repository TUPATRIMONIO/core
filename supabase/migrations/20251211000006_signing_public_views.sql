-- =====================================================
-- Migration: Expose signing views to public schema
-- Description: Create public views for easier client access
-- Created: 2025-12-11
-- =====================================================

SET search_path TO signing, public, extensions;

-- =====================================================
-- VIEWS: Public access to signing tables
-- =====================================================

-- Documents view
CREATE OR REPLACE VIEW public.signing_documents AS
SELECT * FROM signing.documents;

-- Document versions view
CREATE OR REPLACE VIEW public.signing_document_versions AS
SELECT * FROM signing.document_versions;

-- Signers view
CREATE OR REPLACE VIEW public.signing_signers AS
SELECT * FROM signing.signers;

-- Reviewers view
CREATE OR REPLACE VIEW public.signing_reviewers AS
SELECT * FROM signing.reviewers;

-- Comments view
CREATE OR REPLACE VIEW public.signing_comments AS
SELECT * FROM signing.review_comments;

-- AI Reviews view
CREATE OR REPLACE VIEW public.signing_ai_reviews AS
SELECT * FROM signing.ai_reviews;

-- Notary requests view
CREATE OR REPLACE VIEW public.signing_notary_requests AS
SELECT * FROM signing.notary_requests;

-- Notary observations view
CREATE OR REPLACE VIEW public.signing_notary_observations AS
SELECT * FROM signing.notary_observations;

-- Providers view
CREATE OR REPLACE VIEW public.signing_providers AS
SELECT * FROM signing.providers;

-- Provider configs view
CREATE OR REPLACE VIEW public.signing_provider_configs AS
SELECT * FROM signing.provider_configs;

-- Signer history view
CREATE OR REPLACE VIEW public.signing_signer_history AS
SELECT * FROM signing.signer_history;

-- Refund rules view (from billing)
CREATE OR REPLACE VIEW public.refund_rules AS
SELECT * FROM billing.refund_rules;

-- =====================================================
-- GRANTS for views
-- =====================================================

GRANT SELECT ON public.signing_documents TO authenticated;
GRANT SELECT ON public.signing_document_versions TO authenticated;
GRANT SELECT ON public.signing_signers TO authenticated;
GRANT SELECT ON public.signing_reviewers TO authenticated;
GRANT SELECT ON public.signing_comments TO authenticated;
GRANT SELECT ON public.signing_ai_reviews TO authenticated;
GRANT SELECT ON public.signing_notary_requests TO authenticated;
GRANT SELECT ON public.signing_notary_observations TO authenticated;
GRANT SELECT ON public.signing_providers TO authenticated;
GRANT SELECT ON public.signing_provider_configs TO authenticated;
GRANT SELECT ON public.signing_signer_history TO authenticated;
GRANT SELECT ON public.refund_rules TO authenticated;

-- =====================================================
-- COMBINED VIEW: Document with all related data
-- =====================================================

CREATE OR REPLACE VIEW public.signing_documents_full AS
SELECT 
  d.*,
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
LEFT JOIN core.users u ON u.id = d.created_by;

GRANT SELECT ON public.signing_documents_full TO authenticated;

-- =====================================================
-- VIEW: Document signers with order
-- =====================================================

CREATE OR REPLACE VIEW public.signing_signers_ordered AS
SELECT 
  s.*,
  d.title AS document_title,
  d.status AS document_status,
  d.signing_order AS document_signing_order,
  -- Is it this signer's turn? (for sequential signing)
  CASE 
    WHEN d.signing_order = 'simultaneous' THEN true
    WHEN d.signing_order = 'sequential' THEN 
      s.signing_order = (
        SELECT MIN(s2.signing_order) 
        FROM signing.signers s2 
        WHERE s2.document_id = d.id 
          AND s2.status IN ('pending', 'needs_enrollment', 'enrolled')
      )
    ELSE false
  END AS is_current_signer
FROM signing.signers s
JOIN signing.documents d ON d.id = s.document_id
ORDER BY s.signing_order;

GRANT SELECT ON public.signing_signers_ordered TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas públicas de signing creadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas disponibles:';
  RAISE NOTICE '  - signing_documents';
  RAISE NOTICE '  - signing_document_versions';
  RAISE NOTICE '  - signing_signers';
  RAISE NOTICE '  - signing_reviewers';
  RAISE NOTICE '  - signing_comments';
  RAISE NOTICE '  - signing_ai_reviews';
  RAISE NOTICE '  - signing_notary_requests';
  RAISE NOTICE '  - signing_notary_observations';
  RAISE NOTICE '  - signing_providers';
  RAISE NOTICE '  - signing_provider_configs';
  RAISE NOTICE '  - signing_signer_history';
  RAISE NOTICE '  - refund_rules';
  RAISE NOTICE '  - signing_documents_full (con datos relacionados)';
  RAISE NOTICE '  - signing_signers_ordered (con turno de firma)';
END $$;
