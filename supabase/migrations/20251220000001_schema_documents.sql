-- =====================================================
-- Migration: Create documents schema for collaborative editor
-- Description: Schema completo para editor colaborativo con bloqueo
-- Created: 2025-12-19
-- =====================================================

-- Crear el schema documents
CREATE SCHEMA IF NOT EXISTS documents;

-- Set search path
SET search_path TO documents, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE documents.document_status AS ENUM (
  'draft',           -- Borrador
  'in_review',       -- En revisión
  'changes_requested', -- Cambios solicitados
  'approved',        -- Aprobado
  'published',       -- Publicado
  'archived'         -- Archivado
);

CREATE TYPE documents.collaborator_role AS ENUM (
  'owner',           -- Propietario (puede eliminar, cambiar permisos)
  'editor',          -- Puede editar el contenido
  'commenter',       -- Solo puede comentar
  'viewer'           -- Solo lectura
);

-- =====================================================
-- DOCUMENTS (Documento principal)
-- =====================================================

CREATE TABLE documents.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Contenido
  title TEXT NOT NULL DEFAULT 'Sin título' CHECK (length(title) >= 1 AND length(title) <= 500),
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
  plain_text TEXT, -- Texto plano para búsqueda full-text
  
  -- Estado
  status documents.document_status NOT NULL DEFAULT 'draft',
  
  -- Configuración
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  require_approval BOOLEAN NOT NULL DEFAULT false,
  
  -- Sistema de bloqueo
  locked_by UUID REFERENCES core.users(id),
  locked_at TIMESTAMPTZ,
  lock_expires_at TIMESTAMPTZ, -- Expira automáticamente (30 min por defecto)
  
  -- Archivo fuente (si se importó de Word)
  source_file_path TEXT,
  source_file_name TEXT,
  
  -- Metadatos
  word_count INTEGER DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Propietario
  created_by UUID NOT NULL REFERENCES core.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Índices para documentos
CREATE INDEX idx_documents_org ON documents.documents(organization_id);
CREATE INDEX idx_documents_status ON documents.documents(status);
CREATE INDEX idx_documents_created_by ON documents.documents(created_by);
CREATE INDEX idx_documents_locked_by ON documents.documents(locked_by) WHERE locked_by IS NOT NULL;
CREATE INDEX idx_documents_updated ON documents.documents(updated_at DESC);

-- Full-text search
CREATE INDEX idx_documents_search ON documents.documents USING gin(to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(plain_text, '')));

-- =====================================================
-- COLLABORATORS (Colaboradores del documento)
-- =====================================================

CREATE TABLE documents.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Rol
  role documents.collaborator_role NOT NULL DEFAULT 'viewer',
  
  -- Invitación
  invited_by UUID REFERENCES core.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un usuario solo puede estar una vez por documento
  CONSTRAINT unique_collaborator UNIQUE (document_id, user_id)
);

-- Índices
CREATE INDEX idx_collaborators_document ON documents.collaborators(document_id);
CREATE INDEX idx_collaborators_user ON documents.collaborators(user_id);
CREATE INDEX idx_collaborators_role ON documents.collaborators(document_id, role);

-- =====================================================
-- COMMENTS (Comentarios en el documento)
-- =====================================================

CREATE TABLE documents.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Contenido del comentario
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
  
  -- Texto seleccionado (contexto)
  quoted_text TEXT,
  selection_from INTEGER,
  selection_to INTEGER,
  
  -- Threading (respuestas)
  parent_id UUID REFERENCES documents.comments(id) ON DELETE CASCADE,
  thread_id UUID, -- ID del comentario raíz del hilo
  
  -- Estado
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES core.users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_comments_document ON documents.comments(document_id);
CREATE INDEX idx_comments_user ON documents.comments(user_id);
CREATE INDEX idx_comments_parent ON documents.comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_thread ON documents.comments(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_comments_unresolved ON documents.comments(document_id, is_resolved) WHERE is_resolved = false;

-- =====================================================
-- VERSIONS (Historial de versiones)
-- =====================================================

CREATE TABLE documents.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents.documents(id) ON DELETE CASCADE,
  
  -- Versión
  version_number INTEGER NOT NULL,
  
  -- Snapshot del contenido
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  
  -- Metadatos
  created_by UUID NOT NULL REFERENCES core.users(id),
  change_summary TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique por documento
  CONSTRAINT unique_version_number UNIQUE (document_id, version_number)
);

-- Índices
CREATE INDEX idx_versions_document ON documents.versions(document_id);
CREATE INDEX idx_versions_created ON documents.versions(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION documents.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents.documents
  FOR EACH ROW EXECUTE FUNCTION documents.update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON documents.comments
  FOR EACH ROW EXECUTE FUNCTION documents.update_updated_at();

-- Trigger para limpiar locks expirados
CREATE OR REPLACE FUNCTION documents.cleanup_expired_locks()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el lock expiró, limpiarlo
  IF NEW.lock_expires_at IS NOT NULL AND NEW.lock_expires_at < NOW() THEN
    NEW.locked_by = NULL;
    NEW.locked_at = NULL;
    NEW.lock_expires_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_document_locks
  BEFORE UPDATE ON documents.documents
  FOR EACH ROW EXECUTE FUNCTION documents.cleanup_expired_locks();

-- Trigger para auto-asignar thread_id en comentarios
CREATE OR REPLACE FUNCTION documents.set_comment_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- Es un comentario raíz, thread_id = su propio id
    NEW.thread_id = NEW.id;
  ELSE
    -- Es una respuesta, heredar thread_id del padre
    SELECT thread_id INTO NEW.thread_id
    FROM documents.comments
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_comment_thread
  BEFORE INSERT ON documents.comments
  FOR EACH ROW EXECUTE FUNCTION documents.set_comment_thread_id();

-- =====================================================
-- REALTIME
-- =====================================================

-- Habilitar Realtime para documentos (para el sistema de bloqueo)
ALTER TABLE documents.documents REPLICA IDENTITY FULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA documents IS 'Editor colaborativo de documentos con bloqueo y comentarios';
COMMENT ON TABLE documents.documents IS 'Documentos principales del editor colaborativo';
COMMENT ON TABLE documents.collaborators IS 'Colaboradores con acceso a cada documento';
COMMENT ON TABLE documents.comments IS 'Comentarios y discusiones en documentos';
COMMENT ON TABLE documents.versions IS 'Historial de versiones de cada documento';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema documents creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  - documents.documents';
  RAISE NOTICE '  - documents.collaborators';
  RAISE NOTICE '  - documents.comments';
  RAISE NOTICE '  - documents.versions';
END $$;
