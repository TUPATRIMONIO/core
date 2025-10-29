-- ================================
-- Migración OPCIONAL: Deprecar tabla page_management
-- ================================
--
-- ⚠️ NOTA IMPORTANTE:
-- Esta migración es OPCIONAL y está comentada por defecto.
-- Solo aplicarla si has confirmado que el sistema de API funciona correctamente
-- y no necesitas la tabla page_management para ningún propósito.
--
-- Para aplicar:
-- 1. Renombrar archivo a: 20251029HHMMSS_deprecate_page_management.sql
-- 2. Descomentar el código SQL
-- 3. Aplicar migración normalmente
--
-- ================================

/*

-- Eliminar políticas RLS primero
DROP POLICY IF EXISTS "page_management_public_read" ON marketing.page_management;
DROP POLICY IF EXISTS "page_management_admin_all" ON marketing.page_management;
DROP POLICY IF EXISTS "page_management_editor_read" ON marketing.page_management;

-- Eliminar funciones que referencian la tabla
DROP FUNCTION IF EXISTS marketing.get_page_status(text, text);
DROP FUNCTION IF EXISTS marketing.can_access_page(text, text);
DROP FUNCTION IF EXISTS marketing.get_public_pages();

-- Eliminar tabla y todos sus dependientes
DROP TABLE IF EXISTS marketing.page_management CASCADE;

-- Mensaje de confirmación
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla marketing.page_management eliminada exitosamente';
  RAISE NOTICE 'ℹ️  Las páginas ahora se gestionan exclusivamente desde page-config.ts';
  RAISE NOTICE 'ℹ️  El dashboard lee desde la API: /api/pages-config';
END $$;

*/

-- Placeholder para que el archivo sea válido SQL
SELECT 'Migración comentada - No hace cambios' AS status;


