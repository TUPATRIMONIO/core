-- =====================================================
-- Migration: Enhance Notary Resolution
-- Description: Adds attachments and admin notes for notary assignments
-- Created: 2026-02-06
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- 1. Add admin_notes to notary_assignments
ALTER TABLE signing.notary_assignments
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Create notary_assignment_attachments table
CREATE TABLE IF NOT EXISTS signing.notary_assignment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES signing.notary_assignments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notary_attachments_assignment ON signing.notary_assignment_attachments(assignment_id);

-- 3. Enable RLS
ALTER TABLE signing.notary_assignment_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for notary_assignment_attachments

-- Admins/Reviewers can manage attachments
CREATE POLICY "Admins can manage attachments"
  ON signing.notary_assignment_attachments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND (r.slug = 'document_reviewer' OR r.level >= 9)
    )
  );

-- Notaries can view attachments for their assignments
CREATE POLICY "Notaries can view attachments"
  ON signing.notary_assignment_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signing.notary_assignments na
      JOIN signing.notary_offices no ON no.id = na.notary_office_id
      JOIN core.organization_users ou ON ou.organization_id = no.organization_id
      WHERE na.id = notary_assignment_attachments.assignment_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
  );

-- 4. Expose in public view
-- We need to update the public.signing_notary_assignments view to include admin_notes
-- But views cannot be altered to add columns easily if they are SELECT *
-- We'll recreate the view.

CREATE OR REPLACE VIEW public.signing_notary_assignments AS
SELECT * FROM signing.notary_assignments;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signing_notary_assignments TO authenticated, service_role;
ALTER VIEW public.signing_notary_assignments SET (security_invoker = true);

-- Create public view for attachments
CREATE OR REPLACE VIEW public.signing_notary_assignment_attachments AS
SELECT * FROM signing.notary_assignment_attachments;

GRANT SELECT ON public.signing_notary_assignment_attachments TO authenticated;
ALTER VIEW public.signing_notary_assignment_attachments SET (security_invoker = true);

-- 5. Notify
DO $$
BEGIN
  RAISE NOTICE '✅ Migration applied: Enhance Notary Resolution (attachments + admin_notes)';
END $$;
