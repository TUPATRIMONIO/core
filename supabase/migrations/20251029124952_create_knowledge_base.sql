-- Migration: Create Knowledge Base Schema
-- Description: Schema para base de conocimiento similar al blog
-- Created: 2025-10-29

-- Set search path to include marketing schema
SET search_path TO marketing, public, extensions;

-- =====================================================
-- KB CATEGORIES (categorías de artículos)
-- =====================================================

CREATE TABLE IF NOT EXISTS marketing.kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  description TEXT,
  color TEXT DEFAULT '#800039' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon TEXT, -- Nombre del icono lucide-react
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_slug_length CHECK (length(slug) >= 3 AND length(slug) <= 50)
);

-- =====================================================
-- KB ARTICLES (artículos de conocimiento)
-- =====================================================

CREATE TABLE IF NOT EXISTS marketing.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content fields
  title TEXT NOT NULL CHECK (length(title) >= 5 AND length(title) <= 200),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  content TEXT NOT NULL CHECK (length(content) >= 100),
  excerpt TEXT CHECK (length(excerpt) <= 500),
  
  -- Organization
  category_id UUID REFERENCES marketing.kb_categories(id) ON DELETE SET NULL,
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
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  not_helpful_count INTEGER DEFAULT 0 CHECK (not_helpful_count >= 0),
  
  -- Destacado
  featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Tags (array de strings)
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
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
-- ÍNDICES para KB
-- =====================================================

-- Índices para kb_categories
CREATE INDEX IF NOT EXISTS idx_kb_categories_slug ON marketing.kb_categories(slug);
CREATE INDEX IF NOT EXISTS idx_kb_categories_active ON marketing.kb_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_kb_categories_sort ON marketing.kb_categories(sort_order);

-- Índices para kb_articles
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON marketing.kb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON marketing.kb_articles(published);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON marketing.kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_featured ON marketing.kb_articles(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_kb_articles_published_at ON marketing.kb_articles(published_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_kb_articles_tags ON marketing.kb_articles USING GIN(tags);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================

-- Trigger para kb_categories
CREATE OR REPLACE FUNCTION marketing.update_kb_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_categories_updated_at
BEFORE UPDATE ON marketing.kb_categories
FOR EACH ROW
EXECUTE FUNCTION marketing.update_kb_categories_updated_at();

-- Trigger para kb_articles
CREATE OR REPLACE FUNCTION marketing.update_kb_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_articles_updated_at
BEFORE UPDATE ON marketing.kb_articles
FOR EACH ROW
EXECUTE FUNCTION marketing.update_kb_articles_updated_at();

-- =====================================================
-- VISTAS útiles
-- =====================================================

-- Vista de artículos publicados con información de categoría
CREATE OR REPLACE VIEW marketing.kb_articles_public AS
SELECT 
  a.id,
  a.title,
  a.slug,
  a.content,
  a.excerpt,
  a.author_name,
  a.published_at,
  a.seo_title,
  a.seo_description,
  a.reading_time,
  a.view_count,
  a.helpful_count,
  a.not_helpful_count,
  a.featured,
  a.tags,
  a.created_at,
  a.updated_at,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.color as category_color,
  c.icon as category_icon
FROM marketing.kb_articles a
LEFT JOIN marketing.kb_categories c ON a.category_id = c.id
WHERE a.published = true
ORDER BY a.published_at DESC;

-- Vista de artículos destacados
CREATE OR REPLACE VIEW marketing.kb_articles_featured AS
SELECT *
FROM marketing.kb_articles_public
WHERE featured = true
ORDER BY published_at DESC
LIMIT 10;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE marketing.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.kb_articles ENABLE ROW LEVEL SECURITY;

-- Políticas para kb_categories
CREATE POLICY "KB Categories are viewable by everyone"
  ON marketing.kb_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "KB Categories are manageable by authenticated users"
  ON marketing.kb_categories FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para kb_articles
CREATE POLICY "Published KB Articles are viewable by everyone"
  ON marketing.kb_articles FOR SELECT
  USING (published = true);

CREATE POLICY "KB Articles are manageable by authenticated users"
  ON marketing.kb_articles FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANTS
-- =====================================================

-- Grants para categorías
GRANT SELECT ON marketing.kb_categories TO anon, authenticated;
GRANT ALL ON marketing.kb_categories TO authenticated, service_role;

-- Grants para artículos
GRANT SELECT ON marketing.kb_articles TO anon, authenticated;
GRANT ALL ON marketing.kb_articles TO authenticated, service_role;

-- Grants para vistas
GRANT SELECT ON marketing.kb_articles_public TO anon, authenticated;
GRANT SELECT ON marketing.kb_articles_featured TO anon, authenticated;

-- =====================================================
-- DATOS INICIALES (opcional)
-- =====================================================

-- Categorías de ejemplo
INSERT INTO marketing.kb_categories (name, slug, description, color, icon, sort_order) VALUES
  ('Primeros Pasos', 'primeros-pasos', 'Guías para comenzar a usar TuPatrimonio', '#800039', 'Rocket', 1),
  ('Firma Electrónica', 'firma-electronica', 'Todo sobre firma electrónica y digital', '#800039', 'FileSignature', 2),
  ('Verificación de Identidad', 'verificacion-identidad', 'KYC y verificación biométrica', '#800039', 'Shield', 3),
  ('Notaría Digital', 'notaria-digital', 'Trámites notariales online', '#800039', 'FileText', 4),
  ('Facturación y Pagos', 'facturacion-pagos', 'Información sobre planes y pagos', '#800039', 'CreditCard', 5),
  ('Seguridad y Privacidad', 'seguridad-privacidad', 'Protección de datos y seguridad', '#800039', 'Lock', 6),
  ('Integraciones', 'integraciones', 'APIs y conectores', '#800039', 'Plug', 7),
  ('Resolución de Problemas', 'resolucion-problemas', 'Soluciona problemas comunes', '#800039', 'AlertCircle', 8)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE marketing.kb_categories IS 'Categorías de la base de conocimiento';
COMMENT ON TABLE marketing.kb_articles IS 'Artículos de la base de conocimiento';
COMMENT ON VIEW marketing.kb_articles_public IS 'Vista pública de artículos publicados con información de categoría';
COMMENT ON VIEW marketing.kb_articles_featured IS 'Vista de artículos destacados para mostrar en homepage';

