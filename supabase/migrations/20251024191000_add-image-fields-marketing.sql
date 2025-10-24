-- Migration: Add image fields to marketing schema
-- Description: Add optional image fields to blog_categories and metadata fields to blog_posts
-- Created: 2025-10-24

-- =====================================================
-- ALTER blog_categories - Add icon_url field
-- =====================================================

ALTER TABLE marketing.blog_categories
ADD COLUMN IF NOT EXISTS icon_url TEXT;

COMMENT ON COLUMN marketing.blog_categories.icon_url IS 'URL del icono/imagen de la categoría (opcional)';

-- =====================================================
-- ALTER blog_posts - Add content_images metadata
-- =====================================================

ALTER TABLE marketing.blog_posts
ADD COLUMN IF NOT EXISTS content_images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN marketing.blog_posts.content_images IS 'Array JSONB con metadatos de imágenes dentro del contenido del artículo';

-- Ejemplo de estructura para content_images:
-- [
--   {
--     "url": "https://...",
--     "alt": "Descripción de la imagen",
--     "caption": "Pie de foto opcional",
--     "order": 1,
--     "width": 800,
--     "height": 600
--   }
-- ]

-- =====================================================
-- ALTER testimonials - Ensure avatar_url exists
-- =====================================================
-- Ya existe en el schema original, solo agregamos un comentario más descriptivo

COMMENT ON COLUMN marketing.testimonials.avatar_url IS 'URL del avatar del testimonial (preferiblemente desde blog-authors bucket)';

-- =====================================================
-- CREATE helper function para validar content_images
-- =====================================================

CREATE OR REPLACE FUNCTION marketing.validate_content_images(images JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Si es null o array vacío, es válido
  IF images IS NULL OR jsonb_array_length(images) = 0 THEN
    RETURN TRUE;
  END IF;

  -- Verificar que sea un array
  IF jsonb_typeof(images) != 'array' THEN
    RETURN FALSE;
  END IF;

  -- Validar estructura básica de cada imagen
  -- (puedes agregar validaciones más específicas según necesites)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Agregar constraint de validación
ALTER TABLE marketing.blog_posts
ADD CONSTRAINT valid_content_images 
CHECK (marketing.validate_content_images(content_images));

-- =====================================================
-- CREATE indexes para performance
-- =====================================================

-- Índice GIN para búsquedas en content_images JSONB
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_images 
ON marketing.blog_posts USING GIN (content_images);

-- Índice para blog_categories con icon_url no nulo
CREATE INDEX IF NOT EXISTS idx_blog_categories_with_icon 
ON marketing.blog_categories(id) WHERE icon_url IS NOT NULL;

-- =====================================================
-- Success message
-- =====================================================

SELECT 'Image fields added successfully to marketing schema' as result;

