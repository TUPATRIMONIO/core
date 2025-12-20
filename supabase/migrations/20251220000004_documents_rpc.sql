-- =====================================================
-- Migration: RPC Functions for documents
-- Description: Funciones para crear y modificar documentos
-- Created: 2025-12-19
-- =====================================================

SET search_path TO documents, core, public;

-- =====================================================
-- CREATE DOCUMENT RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_document(
  p_title TEXT DEFAULT 'Sin título',
  p_content JSONB DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_document_id UUID;
  v_result JSONB;
BEGIN
  -- Obtener usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Usar org_id proporcionado o buscar la activa del usuario
  IF p_organization_id IS NOT NULL THEN
    v_org_id := p_organization_id;
  ELSE
    SELECT last_active_organization_id INTO v_org_id
    FROM core.users WHERE id = v_user_id;
  END IF;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found';
  END IF;

  -- Crear documento
  INSERT INTO documents.documents (
    title,
    content,
    organization_id,
    created_by
  ) VALUES (
    p_title,
    p_content,
    v_org_id,
    v_user_id
  )
  RETURNING id INTO v_document_id;

  -- Agregar creador como owner
  INSERT INTO documents.collaborators (
    document_id,
    user_id,
    role,
    invited_by,
    accepted_at
  ) VALUES (
    v_document_id,
    v_user_id,
    'owner',
    v_user_id,
    NOW()
  );

  -- Retornar documento creado
  SELECT jsonb_build_object(
    'id', d.id,
    'title', d.title,
    'organization_id', d.organization_id,
    'created_by', d.created_by,
    'created_at', d.created_at
  ) INTO v_result
  FROM documents.documents d
  WHERE d.id = v_document_id;

  RETURN v_result;
END;
$$;

-- =====================================================
-- UPDATE DOCUMENT RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_document(
  p_document_id UUID,
  p_title TEXT DEFAULT NULL,
  p_content JSONB DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_plain_text TEXT;
  v_word_count INTEGER;
BEGIN
  -- Obtener usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verificar que el usuario puede editar
  IF NOT documents.user_can_edit_document(p_document_id) THEN
    RAISE EXCEPTION 'Not authorized to edit this document';
  END IF;

  -- Calcular plain text si hay contenido nuevo
  IF p_content IS NOT NULL THEN
    -- Extraer texto plano del JSON de TipTap
    WITH RECURSIVE content_nodes AS (
      SELECT jsonb_array_elements(p_content->'content') AS node
      UNION ALL
      SELECT jsonb_array_elements(node->'content') AS node
      FROM content_nodes
      WHERE node->'content' IS NOT NULL
    )
    SELECT string_agg(node->>'text', ' ') INTO v_plain_text
    FROM content_nodes
    WHERE node->>'text' IS NOT NULL;

    v_word_count := array_length(regexp_split_to_array(coalesce(v_plain_text, ''), '\s+'), 1);
  END IF;

  -- Actualizar documento
  UPDATE documents.documents
  SET
    title = COALESCE(p_title, title),
    content = COALESCE(p_content, content),
    status = COALESCE(p_status::documents.document_status, status),
    plain_text = COALESCE(v_plain_text, plain_text),
    word_count = COALESCE(v_word_count, word_count),
    updated_at = NOW()
  WHERE id = p_document_id;

  -- Retornar documento actualizado
  SELECT jsonb_build_object(
    'id', d.id,
    'title', d.title,
    'status', d.status,
    'word_count', d.word_count,
    'updated_at', d.updated_at
  ) INTO v_result
  FROM documents.documents d
  WHERE d.id = p_document_id;

  RETURN v_result;
END;
$$;

-- =====================================================
-- GET DOCUMENT RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_document(p_document_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verificar acceso
  IF NOT documents.user_can_access_document(p_document_id) THEN
    RAISE EXCEPTION 'Not authorized to view this document';
  END IF;

  SELECT jsonb_build_object(
    'id', d.id,
    'title', d.title,
    'content', d.content,
    'status', d.status,
    'organization_id', d.organization_id,
    'allow_comments', d.allow_comments,
    'locked_by', d.locked_by,
    'locked_at', d.locked_at,
    'word_count', d.word_count,
    'created_by', d.created_by,
    'created_at', d.created_at,
    'updated_at', d.updated_at
  ) INTO v_result
  FROM documents.documents d
  WHERE d.id = p_document_id;

  RETURN v_result;
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.create_document TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_document TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_document TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ RPCs para documents creadas exitosamente';
END $$;
