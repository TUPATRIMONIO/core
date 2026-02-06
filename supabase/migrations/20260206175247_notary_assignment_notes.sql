-- =====================================================
-- Migration: Notary Assignment Notes (Chat)
-- Description: Creates a table for conversation history between admin and notary
-- Created: 2026-02-06
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- 1. Create table
CREATE TABLE IF NOT EXISTS signing.notary_assignment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES signing.notary_assignments(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'notary')),
  sender_id UUID REFERENCES auth.users(id), -- NULL if system/automated
  message TEXT,
  action_type TEXT CHECK (action_type IN ('needs_correction', 'needs_documents', 'rejected', 'resolved', 'comment', 'received', 'in_progress', 'completed')),
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of {path, name, size, type}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_notary_notes_assignment ON signing.notary_assignment_notes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_notary_notes_created ON signing.notary_assignment_notes(created_at);

-- 3. RLS
ALTER TABLE signing.notary_assignment_notes ENABLE ROW LEVEL SECURITY;

-- Admins/Reviewers can manage all notes
CREATE POLICY "Admins can manage notes"
  ON signing.notary_assignment_notes
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

-- Notaries can view notes for their assignments
CREATE POLICY "Notaries can view notes"
  ON signing.notary_assignment_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signing.notary_assignments na
      JOIN signing.notary_offices no ON no.id = na.notary_office_id
      JOIN core.organization_users ou ON ou.organization_id = no.organization_id
      WHERE na.id = notary_assignment_notes.assignment_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
  );

-- Notaries can insert notes for their assignments
CREATE POLICY "Notaries can insert notes"
  ON signing.notary_assignment_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM signing.notary_assignments na
      JOIN signing.notary_offices no ON no.id = na.notary_office_id
      JOIN core.organization_users ou ON ou.organization_id = no.organization_id
      WHERE na.id = notary_assignment_notes.assignment_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
    AND sender_type = 'notary'
  );

-- 4. Public View
CREATE OR REPLACE VIEW public.signing_notary_assignment_notes AS
SELECT * FROM signing.notary_assignment_notes;

GRANT SELECT, INSERT ON public.signing_notary_assignment_notes TO authenticated, service_role;
ALTER VIEW public.signing_notary_assignment_notes SET (security_invoker = true);

-- 5. Notify
DO $$
BEGIN
  RAISE NOTICE '✅ Migration applied: Notary Assignment Notes (Chat)';
END $$;
