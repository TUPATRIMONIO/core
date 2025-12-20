-- =====================================================
-- Migration: Add RPC for document comments with quoted text
-- Description: Permite a usuarios autenticados agregar comentarios con texto citado
-- Created: 2025-12-19
-- =====================================================

SET search_path TO documents, core, public;

-- RPC para agregar comentario como usuario autenticado
CREATE OR REPLACE FUNCTION public.add_document_comment(
  p_document_id UUID,
  p_content TEXT,
  p_quoted_text TEXT DEFAULT NULL,
  p_selection_from INTEGER DEFAULT NULL,
  p_selection_to INTEGER DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_comment_id UUID;
  v_result JSONB;
  v_org_id UUID;
BEGIN
  -- Obtener usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Obtener organización del documento
  SELECT organization_id INTO v_org_id
  FROM documents.documents
  WHERE id = p_document_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- Verificar que el documento permite comentarios
  IF NOT EXISTS (
    SELECT 1 FROM documents.documents 
    WHERE id = p_document_id AND allow_comments = true
  ) THEN
    RAISE EXCEPTION 'Comments are not allowed on this document';
  END IF;

  -- Crear comentario
  INSERT INTO documents.comments (
    document_id,
    user_id,
    content,
    quoted_text,
    selection_from,
    selection_to,
    parent_id
  ) VALUES (
    p_document_id,
    v_user_id,
    p_content,
    p_quoted_text,
    p_selection_from,
    p_selection_to,
    p_parent_id
  )
  RETURNING id INTO v_comment_id;

  -- Retornar comentario creado con info del usuario
  SELECT jsonb_build_object(
    'id', c.id,
    'document_id', c.document_id,
    'content', c.content,
    'quoted_text', c.quoted_text,
    'created_at', c.created_at,
    'author_first_name', u.first_name,
    'author_last_name', u.last_name
  ) INTO v_result
  FROM documents.comments c
  LEFT JOIN core.users u ON c.user_id = u.id
  WHERE c.id = v_comment_id;

  RETURN v_result;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.add_document_comment TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ RPC add_document_comment creada exitosamente';
END $$;

