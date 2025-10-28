-- =====================================================
-- FIX para INSERT/UPDATE en vistas de blog
-- =====================================================
-- Descripción: Corrige las RULES para que INSERT funcione correctamente
--              especificando solo los campos necesarios (sin id, created_at, updated_at)
-- Fecha: 2025-10-28

-- =====================================================
-- DROP RULES anteriores
-- =====================================================

DROP RULE IF EXISTS blog_posts_insert ON public.blog_posts;
DROP RULE IF EXISTS blog_posts_update ON public.blog_posts;
DROP RULE IF EXISTS blog_categories_insert ON public.blog_categories;
DROP RULE IF EXISTS blog_categories_update ON public.blog_categories;

-- =====================================================
-- NUEVAS RULES corregidas para blog_posts
-- =====================================================

-- Rule para INSERT en blog_posts (solo campos del cliente, sin id/timestamps)
CREATE RULE blog_posts_insert AS
ON INSERT TO public.blog_posts
DO INSTEAD
INSERT INTO marketing.blog_posts (
  title,
  slug,
  content,
  excerpt,
  featured_image_url,
  category_id,
  author_name,
  published,
  published_at,
  seo_title,
  seo_description,
  reading_time,
  view_count
)
VALUES (
  NEW.title,
  NEW.slug,
  NEW.content,
  NEW.excerpt,
  NEW.featured_image_url,
  NEW.category_id,
  NEW.author_name,
  NEW.published,
  NEW.published_at,
  NEW.seo_title,
  NEW.seo_description,
  NEW.reading_time,
  COALESCE(NEW.view_count, 0)
)
RETURNING *;

-- Rule para UPDATE en blog_posts
CREATE RULE blog_posts_update AS
ON UPDATE TO public.blog_posts
DO INSTEAD
UPDATE marketing.blog_posts SET
  title = NEW.title,
  slug = NEW.slug,
  content = NEW.content,
  excerpt = NEW.excerpt,
  featured_image_url = NEW.featured_image_url,
  category_id = NEW.category_id,
  author_name = NEW.author_name,
  published = NEW.published,
  published_at = NEW.published_at,
  seo_title = NEW.seo_title,
  seo_description = NEW.seo_description,
  reading_time = NEW.reading_time,
  view_count = NEW.view_count
WHERE id = OLD.id
RETURNING *;

-- =====================================================
-- NUEVAS RULES corregidas para blog_categories
-- =====================================================

-- Rule para INSERT en blog_categories
CREATE RULE blog_categories_insert AS
ON INSERT TO public.blog_categories
DO INSTEAD
INSERT INTO marketing.blog_categories (
  name,
  slug,
  description,
  color,
  sort_order,
  is_active
)
VALUES (
  NEW.name,
  NEW.slug,
  NEW.description,
  COALESCE(NEW.color, '#800039'),
  COALESCE(NEW.sort_order, 0),
  COALESCE(NEW.is_active, true)
)
RETURNING *;

-- Rule para UPDATE en blog_categories
CREATE RULE blog_categories_update AS
ON UPDATE TO public.blog_categories
DO INSTEAD
UPDATE marketing.blog_categories SET
  name = NEW.name,
  slug = NEW.slug,
  description = NEW.description,
  color = NEW.color,
  sort_order = NEW.sort_order,
  is_active = NEW.is_active
WHERE id = OLD.id
RETURNING *;

-- Success message
SELECT 'Blog views INSERT/UPDATE rules fixed successfully' as result;

