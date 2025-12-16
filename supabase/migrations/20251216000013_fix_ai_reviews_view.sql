-- Migration: Fix signing_ai_reviews view to include raw_response column
-- Description: The view was missing the raw_response column which the Edge Function needs
-- Created: 2025-12-16

-- Recreate public view to include ALL fields including raw_response
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
  r.raw_response,
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

DO $$ 
BEGIN 
  RAISE NOTICE '✅ signing_ai_reviews view fixed with raw_response column';
END $$;
