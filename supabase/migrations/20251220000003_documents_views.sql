-- =====================================================
-- Migration: Public views for documents schema
-- Description: Vistas públicas para acceso desde el cliente
-- Created: 2025-12-19
-- =====================================================

-- Vista de documentos con información del creador
CREATE OR REPLACE VIEW public.documents_documents WITH (security_invoker = true) AS
SELECT 
  d.id,
  d.organization_id,
  d.title,
  d.content,
  d.status,
  d.allow_comments,
  d.require_approval,
  d.locked_by,
  d.locked_at,
  d.lock_expires_at,
  d.source_file_name,
  d.word_count,
  d.created_by,
  d.created_at,
  d.updated_at,
  d.published_at,
  u.first_name as creator_first_name,
  u.last_name as creator_last_name,
  lu.first_name as locker_first_name,
  lu.last_name as locker_last_name
FROM documents.documents d
LEFT JOIN core.users u ON d.created_by = u.id
LEFT JOIN core.users lu ON d.locked_by = lu.id;

-- Vista de colaboradores con información del usuario
CREATE OR REPLACE VIEW public.documents_collaborators WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.document_id,
  c.user_id,
  c.role,
  c.invited_at,
  c.accepted_at,
  u.first_name,
  u.last_name,
  u.avatar_url
FROM documents.collaborators c
LEFT JOIN core.users u ON c.user_id = u.id;

-- Vista de comentarios con información del usuario
CREATE OR REPLACE VIEW public.documents_comments WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.document_id,
  c.user_id,
  c.content,
  c.quoted_text,
  c.selection_from,
  c.selection_to,
  c.parent_id,
  c.thread_id,
  c.is_resolved,
  c.resolved_by,
  c.resolved_at,
  c.created_at,
  c.updated_at,
  u.first_name as author_first_name,
  u.last_name as author_last_name,
  u.avatar_url as author_avatar
FROM documents.comments c
LEFT JOIN core.users u ON c.user_id = u.id;

-- Vista de versiones
CREATE OR REPLACE VIEW public.documents_versions WITH (security_invoker = true) AS
SELECT 
  v.id,
  v.document_id,
  v.version_number,
  v.title,
  v.content,
  v.change_summary,
  v.created_by,
  v.created_at,
  u.first_name as creator_first_name,
  u.last_name as creator_last_name
FROM documents.versions v
LEFT JOIN core.users u ON v.created_by = u.id;

-- Grants para vistas
GRANT SELECT ON public.documents_documents TO authenticated;
GRANT SELECT ON public.documents_collaborators TO authenticated;
GRANT SELECT ON public.documents_comments TO authenticated;
GRANT SELECT ON public.documents_versions TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas públicas para documents creadas exitosamente';
END $$;
