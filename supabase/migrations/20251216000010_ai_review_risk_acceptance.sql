-- Migration: Add risk acceptance tracking to ai_reviews
-- Description: Adds columns to track when a user accepts risks for observed documents (for audit purposes)
-- Created: 2025-12-16

-- Add risk acceptance fields to signing.ai_reviews
ALTER TABLE signing.ai_reviews
  ADD COLUMN IF NOT EXISTS risk_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS risk_accepted_by UUID REFERENCES core.users(id),
  ADD COLUMN IF NOT EXISTS risk_acceptance_note TEXT;

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_ai_reviews_risk_accepted 
  ON signing.ai_reviews(risk_accepted_at) 
  WHERE risk_accepted_at IS NOT NULL;

-- Recreate public view to include new fields
DROP VIEW IF EXISTS public.signing_ai_reviews;

CREATE VIEW public.signing_ai_reviews AS
SELECT 
  r.id,
  r.document_id,
  r.review_type,
  r.prompt_template,
  r.prompt_used,
  r.status,
  r.passed,
  r.confidence_score,
  r.reasons,
  r.suggestions,
  r.ai_model,
  r.tokens_used,
  r.started_at,
  r.completed_at,
  r.metadata,
  r.prompt_id,
  r.prompt_version,
  r.risk_accepted_at,
  r.risk_accepted_by,
  r.risk_acceptance_note
FROM signing.ai_reviews r;

-- Grant permissions
GRANT SELECT, UPDATE ON public.signing_ai_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.signing_ai_reviews TO service_role;

-- Add comment
COMMENT ON COLUMN signing.ai_reviews.risk_accepted_at IS 'Timestamp when user accepted risks for observed document';
COMMENT ON COLUMN signing.ai_reviews.risk_accepted_by IS 'User who accepted the risks';
COMMENT ON COLUMN signing.ai_reviews.risk_acceptance_note IS 'Optional note about risk acceptance';

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Risk acceptance columns added to signing.ai_reviews';
END $$;
