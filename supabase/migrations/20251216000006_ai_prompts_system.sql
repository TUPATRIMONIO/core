-- 1. Create ai_prompts table
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  feature_type TEXT NOT NULL, -- 'document_review', 'classification', 'extraction', 'chat', 'content_generation'
  country_code TEXT NOT NULL, -- 'CL', 'PE', 'MX', 'ALL' (para prompts genéricos)
  version INTEGER NOT NULL, -- Auto-incrementado por feature_type + country_code
  
  -- Contenido del prompt
  name TEXT NOT NULL, -- Nombre descriptivo: "Revisión Legal Chile v3"
  system_prompt TEXT NOT NULL, -- System message para Claude/GPT (soporta markdown)
  user_prompt_template TEXT NOT NULL, -- Template con variables dinámicas
  prompt_format TEXT DEFAULT 'markdown', -- 'markdown', 'plain', 'xml'
  
  -- Configuración del modelo
  ai_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  temperature DECIMAL(3,2) DEFAULT 0.2,
  max_tokens INTEGER DEFAULT 4000,
  output_schema JSONB, -- JSON Schema para structured outputs
  
  -- Variables dinámicas disponibles
  available_variables JSONB DEFAULT '[]', -- ['current_date', 'country_context', 'document_data']
  
  -- Control de versiones
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_deprecated BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  description TEXT, -- Explicación de cambios en esta versión
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  
  -- Variables personalizadas por país
  country_context JSONB DEFAULT '{}', -- {laws: [], customs: [], risk_criteria: {}}
  
  UNIQUE(feature_type, country_code, version)
);

-- Solo un prompt activo por feature_type + country_code
CREATE UNIQUE INDEX unique_active_prompt ON public.ai_prompts (feature_type, country_code) WHERE is_active = true;

-- Indices for ai_prompts
CREATE INDEX idx_ai_prompts_active ON ai_prompts(feature_type, country_code, is_active) WHERE is_active = true;
CREATE INDEX idx_ai_prompts_feature ON ai_prompts(feature_type);
CREATE INDEX idx_ai_prompts_country ON ai_prompts(country_code);

-- 2. Modify signing.ai_reviews table
ALTER TABLE signing.ai_reviews
  ADD COLUMN prompt_id UUID REFERENCES public.ai_prompts(id),
  ADD COLUMN prompt_version INTEGER; -- Desnormalizado para queries rápidas

-- 3. Create ai_prompt_statistics materialized view
CREATE MATERIALIZED VIEW public.ai_prompt_statistics AS
SELECT 
  p.id as prompt_id,
  p.feature_type,
  p.country_code,
  p.version,
  p.name,
  p.is_active,
  
  -- Estadísticas de uso (nuevo formato)
  COUNT(r.id) as total_uses,
  COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN r.status = 'observed' THEN 1 END) as observed_count,
  COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected_count,
  ROUND(
    COUNT(CASE WHEN r.status = 'approved' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(r.id), 0) * 100, 
    2
  ) as approval_rate,
  ROUND(
    COUNT(CASE WHEN r.status = 'observed' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(r.id), 0) * 100, 
    2
  ) as observation_rate,
  ROUND(
    COUNT(CASE WHEN r.status = 'rejected' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(r.id), 0) * 100, 
    2
  ) as rejection_rate,
  
  -- Métricas de confianza
  AVG(r.confidence_score) as avg_confidence,
  MIN(r.confidence_score) as min_confidence,
  MAX(r.confidence_score) as max_confidence,
  
  -- Métricas de uso de tokens
  AVG(r.tokens_used) as avg_tokens,
  SUM(r.tokens_used) as total_tokens,
  
  -- Timestamps
  MIN(r.started_at) as first_used_at,
  MAX(r.started_at) as last_used_at
  
FROM public.ai_prompts p
LEFT JOIN signing.ai_reviews r ON r.prompt_id = p.id
GROUP BY p.id, p.feature_type, p.country_code, p.version, p.name, p.is_active;

-- Index for the view
CREATE INDEX ON ai_prompt_statistics(feature_type, country_code);

-- Enable RLS on the new table
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_prompts (Assuming accessible by authenticated users for now, can be restricted to admins)
CREATE POLICY "Allow read access to authenticated users" ON public.ai_prompts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access to authenticated users" ON public.ai_prompts
  FOR ALL TO authenticated USING (true);
