-- Migration: Actualizar políticas RLS para usar public.is_platform_admin()
-- Description: Las políticas RLS deben usar la función del schema public en lugar de marketing
-- Created: 2025-10-25

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE BLOG_POSTS
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can manage blog posts" ON marketing.blog_posts;
CREATE POLICY "Platform admins can manage blog posts"
ON marketing.blog_posts
FOR ALL
USING (public.is_platform_admin());

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE BLOG_CATEGORIES
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can manage categories" ON marketing.blog_categories;
CREATE POLICY "Platform admins can manage categories"
ON marketing.blog_categories
FOR ALL
USING (public.is_platform_admin());

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE FAQS
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can manage faqs" ON marketing.faqs;
CREATE POLICY "Platform admins can manage faqs"
ON marketing.faqs
FOR ALL
USING (public.is_platform_admin());

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE TESTIMONIALS
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can manage testimonials" ON marketing.testimonials;
CREATE POLICY "Platform admins can manage testimonials"
ON marketing.testimonials
FOR ALL
USING (public.is_platform_admin());

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE CASE_STUDIES
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can manage case studies" ON marketing.case_studies;
CREATE POLICY "Platform admins can manage case studies"
ON marketing.case_studies
FOR ALL
USING (public.is_platform_admin());

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE NEWSLETTER_SUBSCRIBERS
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can view newsletter" ON marketing.newsletter_subscribers;
DROP POLICY IF EXISTS "Platform admins can update newsletter" ON marketing.newsletter_subscribers;
DROP POLICY IF EXISTS "Platform admins can delete newsletter" ON marketing.newsletter_subscribers;

CREATE POLICY "Platform admins can view newsletter"
ON marketing.newsletter_subscribers
FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can update newsletter"
ON marketing.newsletter_subscribers
FOR UPDATE
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can delete newsletter"
ON marketing.newsletter_subscribers
FOR DELETE
USING (public.is_platform_admin());

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE CONTACT_MESSAGES
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can view contact messages" ON marketing.contact_messages;
DROP POLICY IF EXISTS "Platform admins can update contact messages" ON marketing.contact_messages;
DROP POLICY IF EXISTS "Platform admins can delete contact messages" ON marketing.contact_messages;

CREATE POLICY "Platform admins can view contact messages"
ON marketing.contact_messages
FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can update contact messages"
ON marketing.contact_messages
FOR UPDATE
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can delete contact messages"
ON marketing.contact_messages
FOR DELETE
USING (public.is_platform_admin());

-- =====================================================
-- ACTUALIZAR POLÍTICAS DE WAITLIST_SUBSCRIBERS
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can view waitlist" ON marketing.waitlist_subscribers;
DROP POLICY IF EXISTS "Platform admins can update waitlist" ON marketing.waitlist_subscribers;
DROP POLICY IF EXISTS "Platform admins can delete waitlist" ON marketing.waitlist_subscribers;

CREATE POLICY "Platform admins can view waitlist"
ON marketing.waitlist_subscribers
FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can update waitlist"
ON marketing.waitlist_subscribers
FOR UPDATE
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can delete waitlist"
ON marketing.waitlist_subscribers
FOR DELETE
USING (public.is_platform_admin());

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS actualizadas exitosamente para usar public.is_platform_admin()';
  RAISE NOTICE 'ℹ️  Todas las tablas de marketing ahora verifican permisos correctamente';
END $$;

