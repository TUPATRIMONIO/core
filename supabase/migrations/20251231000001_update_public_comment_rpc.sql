-- =====================================================
-- Migration: Update add_public_comment RPC
-- Description: Add support for text selection in public comments
-- Created: 2025-12-31
-- =====================================================

-- Drop old function signature to avoid overload/ambiguity issues
DROP FUNCTION IF EXISTS public.add_public_comment(TEXT, TEXT, TEXT, UUID);


CREATE OR REPLACE FUNCTION public.add_public_comment(
  p_access_token TEXT,
  p_content TEXT,
  p_quoted_text TEXT DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL,
  p_selection_from INTEGER DEFAULT NULL,
  p_selection_to INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_access_record RECORD;
  v_document RECORD;
  v_comment_id UUID;
BEGIN
  -- Buscar registro de acceso
  SELECT * INTO v_access_record
  FROM documents.public_access_log
  WHERE access_token = p_access_token;

  IF v_access_record IS NULL THEN
    RAISE EXCEPTION 'Invalid access token';
  END IF;

  -- Verificar que el documento permite comentarios públicos
  SELECT * INTO v_document
  FROM documents.documents
  WHERE id = v_access_record.document_id
    AND is_public = true
    AND public_access_level = 'comment'
    AND allow_comments = true;

  IF v_document IS NULL THEN
    RAISE EXCEPTION 'Comments not allowed on this document';
  END IF;

  -- Crear comentario
  INSERT INTO documents.comments (
    document_id,
    visitor_access_id,
    content,
    quoted_text,
    selection_from,
    selection_to,
    parent_id
  ) VALUES (
    v_access_record.document_id,
    v_access_record.id,
    p_content,
    p_quoted_text,
    p_selection_from,
    p_selection_to,
    p_parent_id
  )
  RETURNING id INTO v_comment_id;

  -- Retornar comentario
  RETURN jsonb_build_object(
    'id', v_comment_id,
    'content', p_content,
    'quoted_text', p_quoted_text,
    'author_name', v_access_record.visitor_name,
    'author_email', v_access_record.visitor_email,
    'created_at', NOW()
  );
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.add_public_comment TO anon, authenticated;
