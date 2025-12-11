-- =====================================================
-- Migration: Signing schema RLS policies
-- Description: Row Level Security policies for signing schema
-- Created: 2025-12-11
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE signing.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.notary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.notary_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.signer_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Check if user belongs to organization
-- =====================================================

CREATE OR REPLACE FUNCTION signing.user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM core.organization_users
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- HELPER FUNCTION: Check if user is org admin
-- =====================================================

CREATE OR REPLACE FUNCTION signing.user_is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.organization_id = org_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 7  -- admin level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- POLICIES: providers (lectura pública, escritura admin plataforma)
-- =====================================================

CREATE POLICY "Anyone can view active providers"
ON signing.providers FOR SELECT
USING (is_active = true);

CREATE POLICY "Platform admins can manage providers"
ON signing.providers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND o.org_type = 'platform'
      AND r.level >= 9  -- super admin
  )
);

-- =====================================================
-- POLICIES: provider_configs
-- =====================================================

CREATE POLICY "Users can view their org provider configs"
ON signing.provider_configs FOR SELECT
USING (signing.user_belongs_to_org(organization_id));

CREATE POLICY "Admins can manage their org provider configs"
ON signing.provider_configs FOR ALL
USING (signing.user_is_org_admin(organization_id));

-- =====================================================
-- POLICIES: documents
-- =====================================================

CREATE POLICY "Users can view their org documents"
ON signing.documents FOR SELECT
USING (signing.user_belongs_to_org(organization_id));

CREATE POLICY "Users can create documents in their org"
ON signing.documents FOR INSERT
WITH CHECK (signing.user_belongs_to_org(organization_id));

CREATE POLICY "Users can update their org documents"
ON signing.documents FOR UPDATE
USING (signing.user_belongs_to_org(organization_id));

CREATE POLICY "Admins can delete their org documents"
ON signing.documents FOR DELETE
USING (signing.user_is_org_admin(organization_id));

-- =====================================================
-- POLICIES: document_versions
-- =====================================================

CREATE POLICY "Users can view versions of their org documents"
ON signing.document_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

CREATE POLICY "Users can create versions for their org documents"
ON signing.document_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- =====================================================
-- POLICIES: signers
-- =====================================================

CREATE POLICY "Users can view signers of their org documents"
ON signing.signers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- Los firmantes también pueden ver su propia info por token
CREATE POLICY "Signers can view own info by token"
ON signing.signers FOR SELECT
USING (
  signing_token IS NOT NULL
  AND signing_token::text = current_setting('request.headers', true)::json->>'x-signing-token'
);

CREATE POLICY "Users can manage signers of their org documents"
ON signing.signers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- =====================================================
-- POLICIES: reviewers
-- =====================================================

CREATE POLICY "Users can view reviewers of their org documents"
ON signing.reviewers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

CREATE POLICY "Users can manage reviewers of their org documents"
ON signing.reviewers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- =====================================================
-- POLICIES: review_comments
-- =====================================================

CREATE POLICY "Users can view comments on their org documents"
ON signing.review_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

CREATE POLICY "Users can create comments on their org documents"
ON signing.review_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

CREATE POLICY "Users can update own comments"
ON signing.review_comments FOR UPDATE
USING (user_id = auth.uid());

-- =====================================================
-- POLICIES: ai_reviews
-- =====================================================

CREATE POLICY "Users can view ai reviews of their org documents"
ON signing.ai_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- Solo servicio puede crear revisiones de IA
CREATE POLICY "Service role can manage ai reviews"
ON signing.ai_reviews FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- POLICIES: notary_requests
-- =====================================================

CREATE POLICY "Users can view notary requests of their org documents"
ON signing.notary_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

CREATE POLICY "Users can manage notary requests of their org documents"
ON signing.notary_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- =====================================================
-- POLICIES: notary_observations
-- =====================================================

CREATE POLICY "Users can view notary observations"
ON signing.notary_observations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.notary_requests nr
    JOIN signing.documents d ON d.id = nr.document_id
    WHERE nr.id = notary_request_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

CREATE POLICY "Users can create notary observations"
ON signing.notary_observations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM signing.notary_requests nr
    JOIN signing.documents d ON d.id = nr.document_id
    WHERE nr.id = notary_request_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- =====================================================
-- POLICIES: signer_history
-- =====================================================

CREATE POLICY "Users can view signer history of their org documents"
ON signing.signer_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- =====================================================
-- GRANTS
-- =====================================================

-- Schema
GRANT USAGE ON SCHEMA signing TO authenticated;
GRANT USAGE ON SCHEMA signing TO service_role;

-- Tables (authenticated users)
GRANT SELECT ON signing.providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing.provider_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing.documents TO authenticated;
GRANT SELECT, INSERT ON signing.document_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing.signers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing.reviewers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON signing.review_comments TO authenticated;
GRANT SELECT ON signing.ai_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON signing.notary_requests TO authenticated;
GRANT SELECT, INSERT ON signing.notary_observations TO authenticated;
GRANT SELECT ON signing.signer_history TO authenticated;

-- Tables (service_role - full access)
GRANT ALL ON ALL TABLES IN SCHEMA signing TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA signing TO service_role;

-- Functions
GRANT EXECUTE ON FUNCTION signing.user_belongs_to_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION signing.user_is_org_admin(UUID) TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS policies creadas para schema signing';
END $$;
