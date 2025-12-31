-- =====================================================
-- Migration: Get public document comments
-- Description: RPC to retrieve all comments for a public document
-- Created: 2025-12-31
-- =====================================================

-- Create RPC to get comments for a public document
CREATE OR REPLACE FUNCTION public.get_public_document_comments(
  p_access_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_access_record RECORD;
  v_document_id UUID;
  v_result JSONB;
BEGIN
  -- Get access record and document_id
  SELECT * INTO v_access_record
  FROM documents.public_access_log
  WHERE access_token = p_access_token;

  IF v_access_record IS NULL THEN
    RAISE EXCEPTION 'Invalid access token';
  END IF;

  v_document_id := v_access_record.document_id;

  -- Get all comments for this document
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'content', c.content,
      'quoted_text', c.quoted_text,
      'selection_from', c.selection_from,
      'selection_to', c.selection_to,
      'parent_id', c.parent_id,
      'is_resolved', c.is_resolved,
      'created_at', c.created_at,
      'author_name', COALESCE(
        CONCAT_WS(' ', u.first_name, u.last_name),
        pal.visitor_name,
        split_part(pal.visitor_email, '@', 1)
      ),
      'author_email', COALESCE(u.email, pal.visitor_email),
      'is_visitor', c.visitor_access_id IS NOT NULL
    ) ORDER BY c.created_at ASC
  ), '[]'::jsonb) INTO v_result
  FROM documents.comments c
  LEFT JOIN core.users u ON c.user_id = u.id
  LEFT JOIN documents.public_access_log pal ON c.visitor_access_id = pal.id
  WHERE c.document_id = v_document_id;

  RETURN v_result;
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_document_comments TO anon, authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ RPC get_public_document_comments created successfully';
END $$;
