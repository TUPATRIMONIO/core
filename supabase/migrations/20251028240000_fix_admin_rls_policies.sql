-- ============================================================================
-- FIX: Políticas RLS para que admins puedan ver TODO (borradores e inactivos)
-- ============================================================================
-- Fecha: 2025-10-28
-- Descripción: Las políticas actuales filtran posts no publicados y categorías 
--              inactivas incluso para usuarios autenticados del dashboard.
--              Esta migración permite a usuarios autenticados ver todo el contenido.
-- ============================================================================

-- Primero eliminar las políticas existentes que filtran
DROP POLICY IF EXISTS "Public read active blog categories" ON marketing.blog_categories;
DROP POLICY IF EXISTS "Public read published blog posts" ON marketing.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can manage all marketing content" ON marketing.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON marketing.blog_posts;

-- ============================================================================
-- NUEVAS POLÍTICAS PARA BLOG_CATEGORIES
-- ============================================================================

-- Política 1: Público solo ve categorías activas
CREATE POLICY "public_read_active_categories" 
ON marketing.blog_categories 
FOR SELECT 
TO anon
USING (is_active = true);

-- Política 2: Usuarios autenticados ven TODAS las categorías (activas e inactivas)
CREATE POLICY "authenticated_read_all_categories" 
ON marketing.blog_categories 
FOR SELECT 
TO authenticated
USING (true);

-- Política 3: Usuarios autenticados pueden insertar, actualizar, eliminar
CREATE POLICY "authenticated_manage_categories" 
ON marketing.blog_categories 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- NUEVAS POLÍTICAS PARA BLOG_POSTS
-- ============================================================================

-- Política 1: Público solo ve posts publicados
CREATE POLICY "public_read_published_posts" 
ON marketing.blog_posts 
FOR SELECT 
TO anon
USING (published = true);

-- Política 2: Usuarios autenticados ven TODOS los posts (publicados y borradores)
CREATE POLICY "authenticated_read_all_posts" 
ON marketing.blog_posts 
FOR SELECT 
TO authenticated
USING (true);

-- Política 3: Usuarios autenticados pueden insertar, actualizar, eliminar
CREATE POLICY "authenticated_manage_posts" 
ON marketing.blog_posts 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- COMENTARIOS EXPLICATIVOS
-- ============================================================================

COMMENT ON POLICY "public_read_active_categories" ON marketing.blog_categories IS 
  'Usuarios anónimos solo ven categorías activas en el sitio público';

COMMENT ON POLICY "authenticated_read_all_categories" ON marketing.blog_categories IS 
  'Admins autenticados ven todas las categorías para gestión en dashboard';

COMMENT ON POLICY "authenticated_manage_categories" ON marketing.blog_categories IS 
  'Admins pueden crear, editar y eliminar categorías';

COMMENT ON POLICY "public_read_published_posts" ON marketing.blog_posts IS 
  'Usuarios anónimos solo ven posts publicados en el sitio público';

COMMENT ON POLICY "authenticated_read_all_posts" ON marketing.blog_posts IS 
  'Admins autenticados ven todos los posts (incluyendo borradores) para gestión en dashboard';

COMMENT ON POLICY "authenticated_manage_posts" ON marketing.blog_posts IS 
  'Admins pueden crear, editar y eliminar posts';

