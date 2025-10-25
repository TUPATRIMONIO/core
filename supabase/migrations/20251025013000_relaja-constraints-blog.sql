-- Migration: Relajar constraints de blog_posts para desarrollo
-- Description: Permitir posts más cortos para pruebas y borradores
-- Created: 2025-10-25

-- =====================================================
-- ACTUALIZAR CONSTRAINTS DE BLOG_POSTS
-- =====================================================

-- Eliminar constraint antiguo de contenido (mínimo 100 chars)
ALTER TABLE marketing.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_content_check;

-- Agregar nuevo constraint más flexible (mínimo 10 chars)
ALTER TABLE marketing.blog_posts
ADD CONSTRAINT blog_posts_content_check CHECK (length(content) >= 10);

-- Eliminar constraint antiguo de título (mínimo 5 chars)
ALTER TABLE marketing.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_title_check;

-- Agregar nuevo constraint más flexible (mínimo 3 chars)
ALTER TABLE marketing.blog_posts
ADD CONSTRAINT blog_posts_title_check CHECK (length(title) >= 3 AND length(title) <= 200);

-- =====================================================
-- COMENTARIO
-- =====================================================

COMMENT ON CONSTRAINT blog_posts_content_check ON marketing.blog_posts IS 
'Contenido debe tener mínimo 10 caracteres (permite borradores y posts de prueba)';

COMMENT ON CONSTRAINT blog_posts_title_check ON marketing.blog_posts IS 
'Título debe tener entre 3 y 200 caracteres';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Constraints de blog_posts relajados exitosamente';
  RAISE NOTICE 'ℹ️  Contenido: mínimo 10 caracteres (antes 100)';
  RAISE NOTICE 'ℹ️  Título: mínimo 3 caracteres (antes 5)';
END $$;

