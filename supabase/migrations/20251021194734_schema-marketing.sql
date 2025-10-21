-- Migration: Create marketing schema with complete structure
-- Description: Schema para marketing site con blog dinámico, formularios y lead capture
-- Created: 2025-10-21

-- Crear el schema marketing
CREATE SCHEMA IF NOT EXISTS marketing;

-- Set search path to include marketing schema
SET search_path TO marketing, public, extensions;

-- =====================================================
-- ENUMS para el schema marketing
-- =====================================================

CREATE TYPE marketing.subscriber_status AS ENUM ('active', 'unsubscribed', 'bounced');
CREATE TYPE marketing.message_status AS ENUM ('new', 'read', 'replied', 'closed', 'spam');
CREATE TYPE marketing.form_type AS ENUM ('general', 'demo', 'support', 'sales', 'partnership');

-- =====================================================
-- BLOG CATEGORIES (base para blog posts)
-- =====================================================

CREATE TABLE marketing.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  description TEXT,
  color TEXT DEFAULT '#800039' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_slug_length CHECK (length(slug) >= 3 AND length(slug) <= 50)
);

-- =====================================================
-- BLOG POSTS (contenido dinámico principal)
-- =====================================================

CREATE TABLE marketing.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content fields
  title TEXT NOT NULL CHECK (length(title) >= 5 AND length(title) <= 200),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  content TEXT NOT NULL CHECK (length(content) >= 100),
  excerpt TEXT CHECK (length(excerpt) <= 500),
  featured_image_url TEXT,
  
  -- Organization
  category_id UUID REFERENCES marketing.blog_categories(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'TuPatrimonio Team',
  
  -- Publishing
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- SEO fields
  seo_title TEXT CHECK (length(seo_title) <= 60),
  seo_description TEXT CHECK (length(seo_description) <= 160),
  
  -- Metrics
  reading_time INTEGER DEFAULT 5 CHECK (reading_time > 0),
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_slug_length CHECK (length(slug) >= 3 AND length(slug) <= 200),
  CONSTRAINT consistent_publication CHECK (
    (published = true AND published_at IS NOT NULL) OR
    (published = false)
  )
);

-- =====================================================
-- WAITLIST SUBSCRIBERS (lead capture principal)
-- =====================================================

CREATE TABLE marketing.waitlist_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact info
  email TEXT UNIQUE NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  first_name TEXT CHECK (length(first_name) <= 50),
  last_name TEXT CHECK (length(last_name) <= 50),
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL 
      THEN first_name
      ELSE last_name
    END
  ) STORED,
  
  -- Context
  company TEXT CHECK (length(company) <= 100),
  use_case TEXT CHECK (use_case IN ('personal', 'business')),
  referral_source TEXT,
  
  -- Technical tracking
  ip_address INET,
  user_agent TEXT,
  
  -- Status
  status marketing.subscriber_status NOT NULL DEFAULT 'active',
  
  -- Timestamps
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  
  -- Email engagement (futuro)
  email_verified BOOLEAN DEFAULT false,
  last_email_sent TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT consistent_unsubscription CHECK (
    (status = 'unsubscribed' AND unsubscribed_at IS NOT NULL) OR
    (status != 'unsubscribed' AND unsubscribed_at IS NULL)
  )
);

-- =====================================================
-- CONTACT MESSAGES (formularios de contacto)
-- =====================================================

CREATE TABLE marketing.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact details
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  company TEXT CHECK (length(company) <= 100),
  phone TEXT CHECK (length(phone) <= 20),
  
  -- Message content
  subject TEXT CHECK (length(subject) <= 200),
  message TEXT NOT NULL CHECK (length(message) >= 10),
  
  -- Classification
  form_type marketing.form_type DEFAULT 'general',
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  
  -- Status tracking
  status marketing.message_status NOT NULL DEFAULT 'new',
  assigned_to TEXT, -- Admin user handle (futuro)
  
  -- Technical tracking
  ip_address INET,
  user_agent TEXT,
  
  -- Response tracking
  responded_at TIMESTAMPTZ,
  response_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT consistent_response CHECK (
    (status = 'replied' AND responded_at IS NOT NULL) OR
    (status != 'replied')
  )
);

-- =====================================================
-- FAQS (preguntas frecuentes dinámicas)
-- =====================================================

CREATE TABLE marketing.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  question TEXT NOT NULL CHECK (length(question) >= 10 AND length(question) <= 500),
  answer TEXT NOT NULL CHECK (length(answer) >= 10),
  
  -- Organization
  category TEXT NOT NULL DEFAULT 'General',
  sort_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- SEO (futuro)
  is_featured BOOLEAN DEFAULT false,
  
  -- Metrics
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  helpful_votes INTEGER DEFAULT 0 CHECK (helpful_votes >= 0),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TESTIMONIALS (social proof)
-- =====================================================

CREATE TABLE marketing.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Person details
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  company TEXT CHECK (length(company) <= 100),
  position TEXT CHECK (length(position) <= 100),
  
  -- Content
  content TEXT NOT NULL CHECK (length(content) >= 20 AND length(content) <= 1000),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Media
  avatar_url TEXT,
  
  -- Display control
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Service context (opcional)
  service_used TEXT, -- 'firmas', 'verificacion', 'notaria', 'ia'
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- NEWSLETTER SUBSCRIBERS (email marketing futuro)
-- =====================================================

CREATE TABLE marketing.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact info
  email TEXT UNIQUE NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  first_name TEXT CHECK (length(first_name) <= 50),
  
  -- Interests segmentation
  interests TEXT[] DEFAULT '{}',
  
  -- Subscription management
  double_opt_in BOOLEAN DEFAULT false,
  opt_in_ip INET,
  opt_in_date TIMESTAMPTZ,
  
  -- Status
  status marketing.subscriber_status NOT NULL DEFAULT 'active',
  
  -- Timestamps
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  
  -- Email engagement tracking
  last_email_sent TIMESTAMPTZ,
  last_email_opened TIMESTAMPTZ,
  email_open_count INTEGER DEFAULT 0 CHECK (email_open_count >= 0),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT consistent_newsletter_unsubscription CHECK (
    (status = 'unsubscribed' AND unsubscribed_at IS NOT NULL) OR
    (status != 'unsubscribed' AND unsubscribed_at IS NULL)
  )
);

-- =====================================================
-- CASE STUDIES (futuro - casos de éxito)
-- =====================================================

CREATE TABLE marketing.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL CHECK (length(title) >= 10 AND length(title) <= 200),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  
  -- Company details
  company_name TEXT NOT NULL CHECK (length(company_name) <= 100),
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  
  -- Story content
  challenge TEXT NOT NULL CHECK (length(challenge) >= 50),
  solution TEXT NOT NULL CHECK (length(solution) >= 50),
  results TEXT NOT NULL CHECK (length(results) >= 50),
  
  -- Metrics (JSON for flexibility)
  metrics JSONB DEFAULT '{}',
  
  -- Media
  featured_image_url TEXT,
  logo_url TEXT,
  
  -- SEO
  seo_title TEXT CHECK (length(seo_title) <= 60),
  seo_description TEXT CHECK (length(seo_description) <= 160),
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Display
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_case_study_slug_length CHECK (length(slug) >= 3 AND length(slug) <= 200),
  CONSTRAINT consistent_case_study_publication CHECK (
    (is_published = true AND published_at IS NOT NULL) OR
    (is_published = false)
  )
);

-- =====================================================
-- TRIGGERS para Updated Timestamps
-- =====================================================

-- Function para actualizar updated_at (reutilizar desde core si existe)
CREATE OR REPLACE FUNCTION marketing.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a todas las tablas con updated_at
CREATE TRIGGER update_blog_categories_updated_at 
  BEFORE UPDATE ON marketing.blog_categories 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at 
  BEFORE UPDATE ON marketing.blog_posts 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

CREATE TRIGGER update_waitlist_subscribers_updated_at 
  BEFORE UPDATE ON marketing.waitlist_subscribers 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at 
  BEFORE UPDATE ON marketing.contact_messages 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at 
  BEFORE UPDATE ON marketing.faqs 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at 
  BEFORE UPDATE ON marketing.testimonials 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

CREATE TRIGGER update_newsletter_subscribers_updated_at 
  BEFORE UPDATE ON marketing.newsletter_subscribers 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at 
  BEFORE UPDATE ON marketing.case_studies 
  FOR EACH ROW EXECUTE FUNCTION marketing.update_updated_at_column();

-- =====================================================
-- ÍNDICES para Performance
-- =====================================================

-- Blog categories
CREATE INDEX idx_blog_categories_slug ON marketing.blog_categories(slug);
CREATE INDEX idx_blog_categories_active ON marketing.blog_categories(is_active, sort_order);

-- Blog posts (críticos para SEO y performance)
CREATE INDEX idx_blog_posts_published ON marketing.blog_posts(published, published_at DESC) WHERE published = true;
CREATE INDEX idx_blog_posts_category ON marketing.blog_posts(category_id) WHERE published = true;
CREATE INDEX idx_blog_posts_slug ON marketing.blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON marketing.blog_posts(author_name);

-- Waitlist (para admin y segmentación)
CREATE INDEX idx_waitlist_email ON marketing.waitlist_subscribers(email);
CREATE INDEX idx_waitlist_status ON marketing.waitlist_subscribers(status, subscribed_at DESC);
CREATE INDEX idx_waitlist_use_case ON marketing.waitlist_subscribers(use_case) WHERE status = 'active';

-- Contact messages (para admin dashboard)
CREATE INDEX idx_contact_status ON marketing.contact_messages(status, created_at DESC);
CREATE INDEX idx_contact_form_type ON marketing.contact_messages(form_type, status);
CREATE INDEX idx_contact_email ON marketing.contact_messages(email);

-- FAQs
CREATE INDEX idx_faqs_active ON marketing.faqs(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_faqs_category ON marketing.faqs(category, sort_order);
CREATE INDEX idx_faqs_featured ON marketing.faqs(is_featured) WHERE is_featured = true;

-- Testimonials
CREATE INDEX idx_testimonials_active ON marketing.testimonials(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_testimonials_featured ON marketing.testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX idx_testimonials_rating ON marketing.testimonials(rating) WHERE is_active = true;

-- Newsletter
CREATE INDEX idx_newsletter_email ON marketing.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_status ON marketing.newsletter_subscribers(status, subscribed_at DESC);

-- Case studies
CREATE INDEX idx_case_studies_published ON marketing.case_studies(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_case_studies_featured ON marketing.case_studies(is_featured) WHERE is_featured = true;
CREATE INDEX idx_case_studies_slug ON marketing.case_studies(slug);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE marketing.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.waitlist_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.case_studies ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para contenido publicado
CREATE POLICY "Public read active blog categories" ON marketing.blog_categories 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read published blog posts" ON marketing.blog_posts 
  FOR SELECT USING (published = true);

CREATE POLICY "Public read active faqs" ON marketing.faqs 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active testimonials" ON marketing.testimonials 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read published case studies" ON marketing.case_studies 
  FOR SELECT USING (is_published = true);

-- Políticas para inserción pública (formularios web)
CREATE POLICY "Anyone can subscribe to waitlist" ON marketing.waitlist_subscribers 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can send contact messages" ON marketing.contact_messages 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can subscribe to newsletter" ON marketing.newsletter_subscribers 
  FOR INSERT WITH CHECK (true);

-- Políticas de administración (solo usuarios autenticados)
CREATE POLICY "Authenticated users can manage all marketing content" ON marketing.blog_categories 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage blog posts" ON marketing.blog_posts 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view all waitlist" ON marketing.waitlist_subscribers 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage contact messages" ON marketing.contact_messages 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage faqs" ON marketing.faqs 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage testimonials" ON marketing.testimonials 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage newsletter" ON marketing.newsletter_subscribers 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage case studies" ON marketing.case_studies 
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- DATOS INICIALES (Seed Data)
-- =====================================================

-- Categorías del blog
INSERT INTO marketing.blog_categories (name, slug, description, sort_order) VALUES
('Firma Electrónica', 'firma-electronica', 'Todo sobre firmas digitales y electrónicas en Chile', 1),
('Verificación de Identidad', 'verificacion-identidad', 'KYC, biometría y verificación digital', 2),
('Notaría Digital', 'notaria-digital', 'Servicios notariales digitalizados y modernos', 3),
('Compliance', 'compliance', 'Regulaciones y cumplimiento normativo', 4),
('Guías y Tutoriales', 'guias-tutoriales', 'How-to y mejores prácticas paso a paso', 5);

-- FAQs básicas
INSERT INTO marketing.faqs (question, answer, category, sort_order, is_featured) VALUES
('¿Qué es TuPatrimonio?', 'TuPatrimonio es una plataforma integral que combina servicios legales digitales como firmas electrónicas, verificación de identidad y notaría digital, potenciada por inteligencia artificial para brindar una experiencia más eficiente y segura.', 'General', 1, true),

('¿Es válida legalmente la firma electrónica en Chile?', 'Sí, las firmas electrónicas tienen plena validez legal en Chile según la Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación de la Firma Electrónica, y sus modificaciones posteriores. Ofrecemos diferentes tipos de firma según tus necesidades de seguridad.', 'Firma Electrónica', 2, true),

('¿Cómo funciona la verificación de identidad?', 'Utilizamos tecnología biométrica avanzada y verificación de documentos oficiales para confirmar la identidad de los usuarios de manera segura, rápida y 100% digital. El proceso toma menos de 3 minutos y cumple con estándares internacionales de seguridad.', 'Verificación', 3, true),

('¿Qué tipos de documentos puedo notarizar digitalmente?', 'Puedes notarizar digitalmente una amplia variedad de documentos incluyendo contratos, poderes, escrituras, testamentos, y otros documentos legales. Nuestro sistema garantiza la autenticidad y validez legal de todos los documentos procesados.', 'Notaría Digital', 4, false),

('¿Cómo garantizan la seguridad de mis documentos?', 'Implementamos los más altos estándares de seguridad incluyendo encriptación end-to-end, almacenamiento seguro en la nube, autenticación multifactor y cumplimiento con regulaciones de protección de datos. Tus documentos están protegidos con tecnología bancaria.', 'General', 5, true),

('¿Puedo usar TuPatrimonio para mi empresa?', 'Absolutamente. Ofrecemos planes específicos para empresas que incluyen gestión de equipos, facturación corporativa, integraciones con sistemas existentes y soporte dedicado. Perfecto para empresas que buscan digitalizar sus procesos documentales.', 'General', 6, false);

-- Testimoniales de ejemplo (placeholder)
INSERT INTO marketing.testimonials (name, company, position, content, rating, is_featured, service_used) VALUES
('María González', 'StartupTech SpA', 'CEO', 'TuPatrimonio nos permitió digitalizar completamente nuestro proceso de firma de contratos. Lo que antes tomaba días, ahora lo resolvemos en minutos. Una solución increíble para startups que necesitan agilidad.', 5, true, 'firmas'),

('Carlos Mendoza', 'Consultora Legal Mendoza', 'Socio Fundador', 'La verificación de identidad de TuPatrimonio nos ha ayudado a cumplir con regulaciones KYC de manera eficiente. Nuestros clientes quedan impresionados con la facilidad del proceso.', 5, true, 'verificacion'),

('Ana Ruiz', 'Inmobiliaria del Sur', 'Gerente Comercial', 'Hemos notarizado más de 200 contratos de arriendo a través de la plataforma. La validez legal está garantizada y nuestros clientes ahorran tiempo y dinero. Altamente recomendado.', 4, false, 'notaria');

-- =====================================================
-- COMENTARIOS para Documentación
-- =====================================================

COMMENT ON SCHEMA marketing IS 'Schema completo para marketing site: blog dinámico, formularios, lead capture y social proof';

COMMENT ON TABLE marketing.blog_categories IS 'Categorías del blog con organización jerárquica y control de visualización';
COMMENT ON TABLE marketing.blog_posts IS 'Posts del blog con contenido SEO-optimizado, métricas de engagement y sistema de publicación';
COMMENT ON TABLE marketing.waitlist_subscribers IS 'Lista de espera para early adopters con segmentación por tipo de uso y tracking completo';
COMMENT ON TABLE marketing.contact_messages IS 'Mensajes de formularios de contacto con sistema de tickets y clasificación';
COMMENT ON TABLE marketing.faqs IS 'Preguntas frecuentes dinámicas con sistema de voting y featured content';
COMMENT ON TABLE marketing.testimonials IS 'Testimonios de clientes para social proof con rating system y control de display';
COMMENT ON TABLE marketing.newsletter_subscribers IS 'Suscriptores de newsletter con segmentación por intereses y tracking de engagement';
COMMENT ON TABLE marketing.case_studies IS 'Casos de éxito de clientes con métricas cuantificables y storytelling estructurado';

-- Success message
SELECT 'Marketing schema created successfully with ' || 
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'marketing') || 
       ' tables and complete data structure' as result;
