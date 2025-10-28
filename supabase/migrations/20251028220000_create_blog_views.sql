-- =====================================================
-- VISTAS PÚBLICAS para acceso a tablas de marketing
-- =====================================================
-- Descripción: Crea vistas en el schema public para acceder
--              a las tablas del schema marketing desde Supabase JS client
-- Fecha: 2025-10-28

-- Vista para blog_posts
CREATE OR REPLACE VIEW public.blog_posts AS
SELECT * FROM marketing.blog_posts;

-- Vista para blog_categories  
CREATE OR REPLACE VIEW public.blog_categories AS
SELECT * FROM marketing.blog_categories;

-- =====================================================
-- POLÍTICAS RLS para las vistas
-- =====================================================

-- Habilitar RLS en las vistas
ALTER VIEW public.blog_posts SET (security_invoker = true);
ALTER VIEW public.blog_categories SET (security_invoker = true);

-- Las vistas heredan las políticas de las tablas subyacentes automáticamente
-- porque usamos security_invoker = true

-- =====================================================
-- GRANTS para las vistas
-- =====================================================

-- Otorgar permisos SELECT a usuarios anónimos y autenticados
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT ON public.blog_categories TO anon, authenticated;

-- Otorgar permisos completos a usuarios autenticados
-- (las políticas RLS de las tablas base controlarán el acceso real)
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;

-- =====================================================
-- RULES para hacer las vistas modificables
-- =====================================================

-- Rules para INSERT en blog_posts
CREATE OR REPLACE RULE blog_posts_insert AS
ON INSERT TO public.blog_posts
DO INSTEAD
INSERT INTO marketing.blog_posts VALUES (NEW.*) RETURNING *;

-- Rules para UPDATE en blog_posts
CREATE OR REPLACE RULE blog_posts_update AS
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
  view_count = NEW.view_count,
  updated_at = NEW.updated_at
WHERE id = OLD.id
RETURNING *;

-- Rules para DELETE en blog_posts
CREATE OR REPLACE RULE blog_posts_delete AS
ON DELETE TO public.blog_posts
DO INSTEAD
DELETE FROM marketing.blog_posts WHERE id = OLD.id RETURNING *;

-- Rules para INSERT en blog_categories
CREATE OR REPLACE RULE blog_categories_insert AS
ON INSERT TO public.blog_categories
DO INSTEAD
INSERT INTO marketing.blog_categories VALUES (NEW.*) RETURNING *;

-- Rules para UPDATE en blog_categories
CREATE OR REPLACE RULE blog_categories_update AS
ON UPDATE TO public.blog_categories
DO INSTEAD
UPDATE marketing.blog_categories SET
  name = NEW.name,
  slug = NEW.slug,
  description = NEW.description,
  color = NEW.color,
  sort_order = NEW.sort_order,
  is_active = NEW.is_active,
  updated_at = NEW.updated_at
WHERE id = OLD.id
RETURNING *;

-- Rules para DELETE en blog_categories
CREATE OR REPLACE RULE blog_categories_delete AS
ON DELETE TO public.blog_categories
DO INSTEAD
DELETE FROM marketing.blog_categories WHERE id = OLD.id RETURNING *;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW public.blog_posts IS 'Vista pública hacia marketing.blog_posts para acceso desde Supabase JS';
COMMENT ON VIEW public.blog_categories IS 'Vista pública hacia marketing.blog_categories para acceso desde Supabase JS';

-- Success message
SELECT 'Blog views created successfully in public schema' as result;

