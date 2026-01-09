-- =====================================================
-- Migration: Fix RLS for Document Review Access
-- Description: Allow document_reviewer and platform_admin to view all documents
-- Created: 2026-01-06
-- =====================================================

-- Agregar política para que document_reviewer y platform_admin puedan ver todos los documentos
-- Esto es necesario para que la página de revisión de documentos funcione correctamente

DROP POLICY IF EXISTS "Document reviewers can view all documents" ON signing.documents;
CREATE POLICY "Document reviewers can view all documents"
ON signing.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND (
        r.slug = 'document_reviewer'
        OR r.level >= 9  -- platform_admin
      )
  )
);

-- También necesitan poder ver las AI reviews de todos los documentos
DROP POLICY IF EXISTS "Document reviewers can view all ai reviews" ON signing.ai_reviews;
CREATE POLICY "Document reviewers can view all ai reviews"
ON signing.ai_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND (
        r.slug = 'document_reviewer'
        OR r.level >= 9  -- platform_admin
      )
  )
);

-- Y necesitan poder actualizar el estado de los documentos
DROP POLICY IF EXISTS "Document reviewers can update all documents" ON signing.documents;
CREATE POLICY "Document reviewers can update all documents"
ON signing.documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND (
        r.slug = 'document_reviewer'
        OR r.level >= 9  -- platform_admin
      )
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies actualizadas para document_reviewer y platform_admin';
END $$;




