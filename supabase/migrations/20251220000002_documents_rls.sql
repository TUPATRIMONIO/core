-- =====================================================
-- Migration: RLS Policies for documents schema
-- Description: Políticas de seguridad Row Level Security
-- Created: 2025-12-19
-- =====================================================

SET search_path TO documents, core, public;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Función para verificar si el usuario pertenece a la organización
CREATE OR REPLACE FUNCTION documents.user_belongs_to_org(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM core.organization_users
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar acceso a documento
CREATE OR REPLACE FUNCTION documents.user_can_access_document(p_document_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Es el creador
  IF EXISTS (
    SELECT 1 FROM documents.documents
    WHERE id = p_document_id AND created_by = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Es colaborador
  IF EXISTS (
    SELECT 1 FROM documents.collaborators
    WHERE document_id = p_document_id AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si puede editar
CREATE OR REPLACE FUNCTION documents.user_can_edit_document(p_document_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Es el creador
  IF EXISTS (
    SELECT 1 FROM documents.documents
    WHERE id = p_document_id AND created_by = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Es colaborador con rol editor o owner
  IF EXISTS (
    SELECT 1 FROM documents.collaborators
    WHERE document_id = p_document_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE documents.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.versions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: DOCUMENTS
-- =====================================================

-- SELECT: Usuario puede ver documentos donde es creador o colaborador
CREATE POLICY "Users can view accessible documents"
  ON documents.documents FOR SELECT
  USING (documents.user_can_access_document(id));

-- INSERT: Usuario puede crear documentos en su organización
CREATE POLICY "Users can create documents in their org"
  ON documents.documents FOR INSERT
  WITH CHECK (documents.user_belongs_to_org(organization_id));

-- UPDATE: Usuario puede actualizar si puede editar
CREATE POLICY "Users can update editable documents"
  ON documents.documents FOR UPDATE
  USING (documents.user_can_edit_document(id));

-- DELETE: Solo el creador puede eliminar
CREATE POLICY "Creators can delete documents"
  ON documents.documents FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- POLICIES: COLLABORATORS
-- =====================================================

-- SELECT: Ver colaboradores de documentos accesibles
CREATE POLICY "Users can view collaborators"
  ON documents.collaborators FOR SELECT
  USING (documents.user_can_access_document(document_id));

-- INSERT: Solo editores pueden agregar colaboradores
CREATE POLICY "Editors can add collaborators"
  ON documents.collaborators FOR INSERT
  WITH CHECK (documents.user_can_edit_document(document_id));

-- UPDATE: Solo editores pueden modificar roles
CREATE POLICY "Editors can update collaborators"
  ON documents.collaborators FOR UPDATE
  USING (documents.user_can_edit_document(document_id));

-- DELETE: Solo editores pueden remover colaboradores
CREATE POLICY "Editors can remove collaborators"
  ON documents.collaborators FOR DELETE
  USING (documents.user_can_edit_document(document_id));

-- =====================================================
-- POLICIES: COMMENTS
-- =====================================================

-- SELECT: Ver comentarios de documentos accesibles
CREATE POLICY "Users can view comments"
  ON documents.comments FOR SELECT
  USING (documents.user_can_access_document(document_id));

-- INSERT: Usuarios con acceso pueden comentar (si allow_comments = true)
CREATE POLICY "Users can add comments"
  ON documents.comments FOR INSERT
  WITH CHECK (
    documents.user_can_access_document(document_id)
    AND EXISTS (
      SELECT 1 FROM documents.documents
      WHERE id = document_id AND allow_comments = true
    )
  );

-- UPDATE: Solo el autor puede editar su comentario
CREATE POLICY "Users can update own comments"
  ON documents.comments FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Solo el autor o editores pueden eliminar comentarios
CREATE POLICY "Users can delete comments"
  ON documents.comments FOR DELETE
  USING (
    user_id = auth.uid() 
    OR documents.user_can_edit_document(document_id)
  );

-- =====================================================
-- POLICIES: VERSIONS
-- =====================================================

-- SELECT: Ver versiones de documentos accesibles
CREATE POLICY "Users can view versions"
  ON documents.versions FOR SELECT
  USING (documents.user_can_access_document(document_id));

-- INSERT: Solo editores pueden crear versiones
CREATE POLICY "Editors can create versions"
  ON documents.versions FOR INSERT
  WITH CHECK (documents.user_can_edit_document(document_id));

-- =====================================================
-- GRANTS
-- =====================================================

-- Permisos para authenticated
GRANT USAGE ON SCHEMA documents TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA documents TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA documents TO authenticated;

-- Permisos para service_role
GRANT USAGE ON SCHEMA documents TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA documents TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA documents TO service_role;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS policies para documents creadas exitosamente';
END $$;
