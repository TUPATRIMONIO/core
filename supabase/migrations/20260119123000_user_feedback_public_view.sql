-- =====================================================
-- Migration: Public view for user feedback
-- Description: Exponer feedback via schema public para PostgREST
-- Created: 2026-01-19
-- =====================================================

CREATE OR REPLACE VIEW public.user_feedback AS
SELECT *
FROM communications.user_feedback;

GRANT SELECT, INSERT ON public.user_feedback TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_feedback TO authenticated;
