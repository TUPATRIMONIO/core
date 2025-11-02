-- Migration: Create Google Reviews System
-- Description: Sistema completo para gestionar reseñas de Google en schema marketing
-- Created: 2025-11-02

-- Set search path to include marketing schema
SET search_path TO marketing, public, extensions;

-- =====================================================
-- TABLA: google_reviews
-- =====================================================

CREATE TABLE IF NOT EXISTS marketing.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Google Review Data
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  profile_photo_url TEXT,
  author_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL DEFAULT '',
  time TIMESTAMPTZ NOT NULL, -- Fecha original de la reseña en Google
  relative_time_description TEXT,
  language TEXT DEFAULT 'es',
  
  -- Metadata
  place_id TEXT NOT NULL, -- Google Place ID
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false, -- Reseñas destacadas para mostrar prioritariamente
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint único: combinación de author_name, place_id y time
  CONSTRAINT unique_review_per_author UNIQUE (author_name, place_id, time)
);

-- =====================================================
-- TABLA: google_sync_logs
-- =====================================================

CREATE TABLE IF NOT EXISTS marketing.google_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sync Information
  place_id TEXT NOT NULL,
  place_name TEXT,
  sync_started_at TIMESTAMPTZ NOT NULL,
  sync_completed_at TIMESTAMPTZ,
  
  -- Results
  success BOOLEAN NOT NULL DEFAULT false,
  reviews_fetched INTEGER DEFAULT 0,
  reviews_new INTEGER DEFAULT 0,
  reviews_updated INTEGER DEFAULT 0,
  reviews_skipped INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  error_code TEXT,
  
  -- API Response metadata (JSONB para flexibilidad)
  api_response_metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES para mejor performance
-- =====================================================

-- Índices para google_reviews
CREATE INDEX IF NOT EXISTS idx_google_reviews_place_id ON marketing.google_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_google_reviews_rating ON marketing.google_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_google_reviews_time ON marketing.google_reviews(time DESC);
CREATE INDEX IF NOT EXISTS idx_google_reviews_active ON marketing.google_reviews(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_google_reviews_featured ON marketing.google_reviews(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_google_reviews_place_active ON marketing.google_reviews(place_id, is_active, rating);

-- Índices para google_sync_logs
CREATE INDEX IF NOT EXISTS idx_google_sync_logs_place_id ON marketing.google_sync_logs(place_id);
CREATE INDEX IF NOT EXISTS idx_google_sync_logs_completed ON marketing.google_sync_logs(sync_completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_sync_logs_success ON marketing.google_sync_logs(success, place_id);

-- =====================================================
-- TRIGGER para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION marketing.update_google_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_reviews_updated_at
BEFORE UPDATE ON marketing.google_reviews
FOR EACH ROW
EXECUTE FUNCTION marketing.update_google_reviews_updated_at();

-- =====================================================
-- FUNCIÓN RPC: needs_sync
-- Verifica si es necesario sincronizar (última sync hace >24h)
-- =====================================================

CREATE OR REPLACE FUNCTION marketing.needs_sync(p_place_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  last_sync_time TIMESTAMPTZ;
BEGIN
  -- Obtener la última sincronización exitosa
  SELECT sync_completed_at INTO last_sync_time
  FROM marketing.google_sync_logs
  WHERE place_id = p_place_id
    AND success = true
  ORDER BY sync_completed_at DESC
  LIMIT 1;
  
  -- Si no hay sincronizaciones previas, necesita sync
  IF last_sync_time IS NULL THEN
    RETURN true;
  END IF;
  
  -- Verificar si han pasado más de 24 horas
  RETURN (NOW() - last_sync_time) > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN RPC: get_reviews_stats
-- Obtiene estadísticas de las reseñas para un place_id
-- =====================================================

CREATE OR REPLACE FUNCTION marketing.get_reviews_stats(p_place_id TEXT)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  five_star BIGINT,
  four_star BIGINT,
  three_star BIGINT,
  two_star BIGINT,
  one_star BIGINT,
  latest_review_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_reviews,
    ROUND(AVG(rating), 2) AS average_rating,
    COUNT(*) FILTER (WHERE rating = 5) AS five_star,
    COUNT(*) FILTER (WHERE rating = 4) AS four_star,
    COUNT(*) FILTER (WHERE rating = 3) AS three_star,
    COUNT(*) FILTER (WHERE rating = 2) AS two_star,
    COUNT(*) FILTER (WHERE rating = 1) AS one_star,
    MAX(time) AS latest_review_date
  FROM marketing.google_reviews
  WHERE place_id = p_place_id
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VISTAS útiles
-- =====================================================

-- Vista de reseñas activas de 5 estrellas (más comunes para mostrar)
CREATE OR REPLACE VIEW marketing.google_reviews_five_stars AS
SELECT 
  id,
  author_name,
  author_photo_url,
  profile_photo_url,
  author_url,
  rating,
  text,
  time,
  relative_time_description,
  language,
  place_id,
  is_featured,
  created_at
FROM marketing.google_reviews
WHERE is_active = true
  AND rating = 5
ORDER BY time DESC;

-- Vista de reseñas destacadas
CREATE OR REPLACE VIEW marketing.google_reviews_featured AS
SELECT 
  id,
  author_name,
  author_photo_url,
  profile_photo_url,
  author_url,
  rating,
  text,
  time,
  relative_time_description,
  language,
  place_id,
  created_at
FROM marketing.google_reviews
WHERE is_active = true
  AND is_featured = true
ORDER BY time DESC;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE marketing.google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.google_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para google_reviews
-- Lectura pública para reseñas activas
CREATE POLICY "Google Reviews are viewable by everyone"
  ON marketing.google_reviews FOR SELECT
  USING (is_active = true);

-- Solo service_role puede insertar/actualizar/eliminar
CREATE POLICY "Google Reviews are manageable by service role"
  ON marketing.google_reviews FOR ALL
  USING (auth.role() = 'service_role');

-- Políticas para google_sync_logs
-- Solo authenticated puede ver logs
CREATE POLICY "Sync logs are viewable by authenticated users"
  ON marketing.google_sync_logs FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Solo service_role puede crear logs
CREATE POLICY "Sync logs are manageable by service role"
  ON marketing.google_sync_logs FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- GRANTS
-- =====================================================

-- Grants para google_reviews
GRANT SELECT ON marketing.google_reviews TO anon, authenticated;
GRANT ALL ON marketing.google_reviews TO service_role;

-- Grants para google_sync_logs
GRANT SELECT ON marketing.google_sync_logs TO authenticated, service_role;
GRANT ALL ON marketing.google_sync_logs TO service_role;

-- Grants para vistas
GRANT SELECT ON marketing.google_reviews_five_stars TO anon, authenticated;
GRANT SELECT ON marketing.google_reviews_featured TO anon, authenticated;

-- Grants para funciones RPC
GRANT EXECUTE ON FUNCTION marketing.needs_sync(TEXT) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION marketing.get_reviews_stats(TEXT) TO authenticated, service_role, anon;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE marketing.google_reviews IS 'Reseñas de Google almacenadas localmente para mejor control y performance';
COMMENT ON TABLE marketing.google_sync_logs IS 'Registro de sincronizaciones con Google Places API';
COMMENT ON FUNCTION marketing.needs_sync(TEXT) IS 'Verifica si es necesario sincronizar reseñas (>24h desde última sync)';
COMMENT ON FUNCTION marketing.get_reviews_stats(TEXT) IS 'Obtiene estadísticas agregadas de reseñas para un place_id';
COMMENT ON VIEW marketing.google_reviews_five_stars IS 'Vista optimizada de reseñas de 5 estrellas activas';
COMMENT ON VIEW marketing.google_reviews_featured IS 'Vista de reseñas destacadas para mostrar prioritariamente';

