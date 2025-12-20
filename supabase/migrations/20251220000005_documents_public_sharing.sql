-- =====================================================
-- Migration: Public sharing for documents
-- Description: Permite compartir documentos via link público
--              con registro de accesos para trazabilidad
-- Created: 2025-12-19
-- =====================================================

SET search_path TO documents, core, public;

-- =====================================================
-- NUEVAS COLUMNAS EN DOCUMENTS
-- =====================================================

-- Agregar configuración de compartir público
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS 
  is_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS 
  public_token TEXT UNIQUE;

ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS 
  public_access_level TEXT DEFAULT 'view' 
  CHECK (public_access_level IN ('view', 'comment'));

ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS 
  require_email_for_public BOOLEAN NOT NULL DEFAULT true;

-- Índice para búsqueda por token
CREATE INDEX IF NOT EXISTS idx_documents_public_token 
  ON documents.documents(public_token) WHERE public_token IS NOT NULL;

-- =====================================================
-- TABLA: ACCESOS PÚBLICOS (Trazabilidad)
-- =====================================================

CREATE TABLE IF NOT EXISTS documents.public_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents.documents(id) ON DELETE CASCADE,
  
  -- Visitante (no autenticado)
  visitor_email TEXT NOT NULL,
  visitor_name TEXT,
  
  -- Tracking
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  ip_address INET,
  user_agent TEXT,
  
  -- Actividad
  first_access_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_access_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER NOT NULL DEFAULT 1,
  
  -- Estado
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  CONSTRAINT unique_visitor_per_doc UNIQUE (document_id, visitor_email)
);

-- Índices
CREATE INDEX idx_public_access_document ON documents.public_access_log(document_id);
CREATE INDEX idx_public_access_email ON documents.public_access_log(visitor_email);
CREATE INDEX idx_public_access_token ON documents.public_access_log(access_token);

-- =====================================================
-- MODIFICAR COMMENTS PARA VISITANTES
-- =====================================================

-- Permitir comentarios de visitantes (user_id puede ser NULL)
ALTER TABLE documents.comments 
  ALTER COLUMN user_id DROP NOT NULL;

-- Agregar referencia a visitante
ALTER TABLE documents.comments ADD COLUMN IF NOT EXISTS 
  visitor_access_id UUID REFERENCES documents.public_access_log(id);

-- Un comentario debe tener user_id O visitor_access_id
ALTER TABLE documents.comments ADD CONSTRAINT comment_author_check
  CHECK (user_id IS NOT NULL OR visitor_access_id IS NOT NULL);

-- =====================================================
-- RPCs PARA ACCESO PÚBLICO
-- =====================================================

-- Generar token público para un documento
CREATE OR REPLACE FUNCTION public.enable_document_public_sharing(
  p_document_id UUID,
  p_access_level TEXT DEFAULT 'comment',
  p_require_email BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar que puede editar
  IF NOT documents.user_can_edit_document(p_document_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Generar token único
  v_token := encode(extensions.gen_random_bytes(16), 'hex');

  -- Actualizar documento
  UPDATE documents.documents
  SET 
    is_public = true,
    public_token = v_token,
    public_access_level = p_access_level,
    require_email_for_public = p_require_email
  WHERE id = p_document_id;

  -- Retornar info
  SELECT jsonb_build_object(
    'token', v_token,
    'share_url', '/share/' || v_token,
    'access_level', p_access_level,
    'require_email', p_require_email
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Desactivar compartir público
CREATE OR REPLACE FUNCTION public.disable_document_public_sharing(p_document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT documents.user_can_edit_document(p_document_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE documents.documents
  SET 
    is_public = false,
    public_token = NULL
  WHERE id = p_document_id;

  RETURN true;
END;
$$;

-- Registrar acceso de visitante
CREATE OR REPLACE FUNCTION public.register_public_document_access(
  p_token TEXT,
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document_id UUID;
  v_access_id UUID;
  v_access_token TEXT;
  v_result JSONB;
BEGIN
  -- Buscar documento por token
  SELECT id INTO v_document_id
  FROM documents.documents
  WHERE public_token = p_token AND is_public = true;

  IF v_document_id IS NULL THEN
    RAISE EXCEPTION 'Document not found or not public';
  END IF;

  -- Insertar o actualizar registro de acceso
  INSERT INTO documents.public_access_log (
    document_id,
    visitor_email,
    visitor_name,
    ip_address,
    user_agent
  ) VALUES (
    v_document_id,
    lower(trim(p_email)),
    p_name,
    p_ip_address::inet,
    p_user_agent
  )
  ON CONFLICT (document_id, visitor_email) DO UPDATE
  SET 
    last_access_at = NOW(),
    access_count = documents.public_access_log.access_count + 1,
    visitor_name = COALESCE(EXCLUDED.visitor_name, documents.public_access_log.visitor_name)
  RETURNING id, access_token INTO v_access_id, v_access_token;

  -- Retornar documento y access token
  SELECT jsonb_build_object(
    'access_id', v_access_id,
    'access_token', v_access_token,
    'document', jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'content', d.content,
      'access_level', d.public_access_level,
      'allow_comments', d.allow_comments AND d.public_access_level = 'comment'
    )
  ) INTO v_result
  FROM documents.documents d
  WHERE d.id = v_document_id;

  RETURN v_result;
END;
$$;

-- Agregar comentario como visitante
CREATE OR REPLACE FUNCTION public.add_public_comment(
  p_access_token TEXT,
  p_content TEXT,
  p_quoted_text TEXT DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL
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
    parent_id
  ) VALUES (
    v_access_record.document_id,
    v_access_record.id,
    p_content,
    p_quoted_text,
    p_parent_id
  )
  RETURNING id INTO v_comment_id;

  -- Retornar comentario
  RETURN jsonb_build_object(
    'id', v_comment_id,
    'content', p_content,
    'author_name', v_access_record.visitor_name,
    'author_email', v_access_record.visitor_email,
    'created_at', NOW()
  );
END;
$$;

-- Obtener log de accesos de un documento
CREATE OR REPLACE FUNCTION public.get_document_access_log(p_document_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT documents.user_can_access_document(p_document_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'id', pal.id,
    'email', pal.visitor_email,
    'name', pal.visitor_name,
    'first_access', pal.first_access_at,
    'last_access', pal.last_access_at,
    'access_count', pal.access_count
  ) ORDER BY pal.last_access_at DESC)
  INTO v_result
  FROM documents.public_access_log pal
  WHERE pal.document_id = p_document_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.enable_document_public_sharing TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_document_public_sharing TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_public_document_access TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_public_comment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_document_access_log TO authenticated;

-- =====================================================
-- RLS para public_access_log
-- =====================================================

ALTER TABLE documents.public_access_log ENABLE ROW LEVEL SECURITY;

-- Solo los colaboradores del documento pueden ver el log
CREATE POLICY "Collaborators can view access log"
  ON documents.public_access_log FOR SELECT
  USING (documents.user_can_access_document(document_id));

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Public sharing para documents configurado exitosamente';
END $$;
