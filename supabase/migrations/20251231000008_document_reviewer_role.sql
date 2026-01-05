-- =====================================================
-- Migration: Create document_reviewer role
-- Description: Rol para revisores de documentos en proceso de firma
-- Created: 2025-12-31
-- =====================================================

SET search_path TO core, signing, public, extensions;

-- =====================================================
-- CREAR ROL document_reviewer
-- =====================================================

-- Rol: document_reviewer (nivel 5)
-- Revisor de documentos - Puede revisar documentos en manual_review y needs_correction
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Document Reviewer',
  'document_reviewer',
  'Revisor de documentos - Revisa y aprueba documentos en proceso de firma electrónica',
  5,
  true,
  jsonb_build_object(
    'signatures', jsonb_build_object(
      'view', true,
      'review', true,
      'approve', true,
      'reject', true,
      'request_correction', true,
      'view_messages', true,
      'create_messages', true,
      'view_internal_messages', true
    ),
    'documents', jsonb_build_object(
      'view_review_queue', true,
      'view_all_statuses', true
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  level = EXCLUDED.level;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Rol document_reviewer creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos del rol:';
  RAISE NOTICE '  - Ver documentos en revisión';
  RAISE NOTICE '  - Aprobar documentos';
  RAISE NOTICE '  - Rechazar documentos';
  RAISE NOTICE '  - Solicitar correcciones';
  RAISE NOTICE '  - Ver y crear mensajes (incluyendo internos)';
END $$;

