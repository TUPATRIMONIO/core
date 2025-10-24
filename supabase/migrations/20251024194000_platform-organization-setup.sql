-- Migration: Setup Platform Organization and Marketing Admin Roles
-- Description: Configura la organización platform, roles de admin, y políticas RLS restrictivas para marketing
-- Created: 2025-10-24

-- =====================================================
-- 1. EXTENDER SCHEMA CORE CON ORG_TYPE
-- =====================================================

-- Agregar columna org_type a organizations
ALTER TABLE core.organizations 
ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'business' 
CHECK (org_type IN ('personal', 'business', 'platform'));

COMMENT ON COLUMN core.organizations.org_type IS 
'Tipo de organización: personal (B2C), business (B2B), platform (TuPatrimonio admins)';

-- =====================================================
-- 2. CREAR ORGANIZACIÓN PLATFORM
-- =====================================================

-- Crear organización especial para admins de TuPatrimonio
INSERT INTO core.organizations (
  name,
  slug,
  org_type,
  status,
  settings
) VALUES (
  'TuPatrimonio Platform',
  'tupatrimonio-platform',
  'platform',
  'active',
  jsonb_build_object(
    'is_platform_org', true,
    'system_organization', true,
    'can_access_all_content', true
  )
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 3. CREAR ROLES DE PLATAFORMA
-- =====================================================

-- Rol: Platform Super Admin (acceso total)
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Platform Super Admin',
  'platform_super_admin',
  'Acceso total al sistema - Cofounders y CTO',
  10,
  true,
  jsonb_build_object(
    'platform', jsonb_build_object('*', true),
    'marketing', jsonb_build_object('*', true),
    'users', jsonb_build_object('manage', true),
    'organizations', jsonb_build_object('manage', true)
  )
) ON CONFLICT (slug) DO NOTHING;

-- Rol: Marketing Admin (gestión de contenido)
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Marketing Admin',
  'marketing_admin',
  'Gestión de contenido de marketing - Blog y landing pages',
  7,
  true,
  jsonb_build_object(
    'marketing', jsonb_build_object(
      'blog_posts', true,
      'categories', true,
      'faqs', true,
      'testimonials', true,
      'case_studies', true,
      'newsletter', true,
      'contacts', true,
      'waitlist', true
    )
  )
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 4. HELPER FUNCTION: VERIFICAR ADMIN PLATFORM
-- =====================================================

-- Function para verificar si un usuario es admin de plataforma
CREATE OR REPLACE FUNCTION marketing.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Si no hay usuario autenticado, no es admin
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar si el usuario actual pertenece a la org platform con rol admin
  SELECT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND o.org_type = 'platform'
      AND r.slug IN ('platform_super_admin', 'marketing_admin')
      AND ou.status = 'active'
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, false);
END;
$$;

COMMENT ON FUNCTION marketing.is_platform_admin() IS 
'Verifica si el usuario actual es admin de plataforma (puede gestionar contenido de marketing)';

-- =====================================================
-- 5. ACTUALIZAR POLÍTICAS RLS DE MARKETING
-- =====================================================

-- Eliminar políticas antiguas (muy permisivas)
DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON marketing.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can manage all marketing content" ON marketing.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can manage faqs" ON marketing.faqs;
DROP POLICY IF EXISTS "Authenticated users can manage testimonials" ON marketing.testimonials;
DROP POLICY IF EXISTS "Authenticated users can manage case studies" ON marketing.case_studies;
DROP POLICY IF EXISTS "Authenticated users can manage contact messages" ON marketing.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can view all waitlist" ON marketing.waitlist_subscribers;
DROP POLICY IF EXISTS "Authenticated users can manage newsletter" ON marketing.newsletter_subscribers;

-- =====================================================
-- NUEVAS POLÍTICAS RESTRICTIVAS
-- =====================================================

-- Blog Posts: Solo platform admins pueden gestionar
CREATE POLICY "Platform admins can manage blog posts"
ON marketing.blog_posts
FOR ALL
USING (marketing.is_platform_admin());

-- Blog Categories: Solo platform admins pueden gestionar
CREATE POLICY "Platform admins can manage categories"
ON marketing.blog_categories
FOR ALL
USING (marketing.is_platform_admin());

-- FAQs: Solo platform admins pueden gestionar
CREATE POLICY "Platform admins can manage faqs"
ON marketing.faqs
FOR ALL
USING (marketing.is_platform_admin());

-- Testimonials: Solo platform admins pueden gestionar
CREATE POLICY "Platform admins can manage testimonials"
ON marketing.testimonials
FOR ALL
USING (marketing.is_platform_admin());

-- Case Studies: Solo platform admins pueden gestionar
CREATE POLICY "Platform admins can manage case studies"
ON marketing.case_studies
FOR ALL
USING (marketing.is_platform_admin());

-- Newsletter: Inserción pública (ya existe), gestión admin (separar en políticas individuales)
CREATE POLICY "Platform admins can view newsletter"
ON marketing.newsletter_subscribers
FOR SELECT
USING (marketing.is_platform_admin());

CREATE POLICY "Platform admins can update newsletter"
ON marketing.newsletter_subscribers
FOR UPDATE
USING (marketing.is_platform_admin());

CREATE POLICY "Platform admins can delete newsletter"
ON marketing.newsletter_subscribers
FOR DELETE
USING (marketing.is_platform_admin());

-- Contact Messages: Solo platform admins pueden ver y actualizar
CREATE POLICY "Platform admins can view contact messages"
ON marketing.contact_messages
FOR SELECT
USING (marketing.is_platform_admin());

CREATE POLICY "Platform admins can update contact messages"
ON marketing.contact_messages
FOR UPDATE
USING (marketing.is_platform_admin());

CREATE POLICY "Platform admins can delete contact messages"
ON marketing.contact_messages
FOR DELETE
USING (marketing.is_platform_admin());

-- Waitlist: Solo platform admins pueden ver y actualizar
CREATE POLICY "Platform admins can view waitlist"
ON marketing.waitlist_subscribers
FOR SELECT
USING (marketing.is_platform_admin());

CREATE POLICY "Platform admins can update waitlist"
ON marketing.waitlist_subscribers
FOR UPDATE
USING (marketing.is_platform_admin());

CREATE POLICY "Platform admins can delete waitlist"
ON marketing.waitlist_subscribers
FOR DELETE
USING (marketing.is_platform_admin());

-- =====================================================
-- 6. STORAGE BUCKETS SETUP
-- =====================================================

-- Crear buckets necesarios
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('marketing-images', 'marketing-images', true),
  ('documents', 'documents', false),
  ('public-assets', 'public-assets', true),
  ('ai-training-data', 'ai-training-data', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE STORAGE: marketing-images (público)
-- =====================================================

-- Lectura pública de imágenes de marketing
CREATE POLICY "Public can view marketing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-images');

-- Solo platform admins pueden subir/actualizar imágenes
CREATE POLICY "Platform admins can upload marketing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'marketing-images' 
  AND marketing.is_platform_admin()
);

CREATE POLICY "Platform admins can update marketing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'marketing-images'
  AND marketing.is_platform_admin()
);

CREATE POLICY "Platform admins can delete marketing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'marketing-images'
  AND marketing.is_platform_admin()
);

-- =====================================================
-- POLÍTICAS DE STORAGE: public-assets (público)
-- =====================================================

-- Lectura pública
CREATE POLICY "Public can view public assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Solo platform admins pueden gestionar
CREATE POLICY "Platform admins can manage public assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'public-assets'
  AND marketing.is_platform_admin()
);

-- =====================================================
-- POLÍTICAS DE STORAGE: documents (privado)
-- =====================================================

-- Usuarios pueden ver sus propios documentos (organizados por user_id/)
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Platform admins pueden ver todos los documentos
CREATE POLICY "Platform admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND marketing.is_platform_admin()
);

-- =====================================================
-- POLÍTICAS DE STORAGE: ai-training-data (privado)
-- =====================================================

-- Solo platform admins pueden acceder
CREATE POLICY "Platform admins can manage AI training data"
ON storage.objects FOR ALL
USING (
  bucket_id = 'ai-training-data'
  AND marketing.is_platform_admin()
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Platform organization setup completado exitosamente';
  RAISE NOTICE 'ℹ️  Siguiente paso: Crear usuarios admin y vincularlos a la org platform';
  RAISE NOTICE 'ℹ️  Ver instrucciones en: sistema-roles-marketing-blog.plan.md';
END $$;

