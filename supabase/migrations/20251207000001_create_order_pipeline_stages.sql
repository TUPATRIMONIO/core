-- =====================================================
-- Migration: Create order pipeline stages
-- Description: Sistema de pipeline de estados global para pedidos
-- Created: 2025-12-07
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- PIPELINE STAGES TABLE
-- =====================================================

CREATE TABLE billing.order_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE, -- NULL = global
  
  -- Stage details
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT, -- Color para UI (yellow, blue, orange, green, gray, red)
  is_final BOOLEAN DEFAULT false, -- Si es un estado final (completed, cancelled, refunded)
  
  -- Auto actions (triggers automáticos cuando se alcanza este estado)
  auto_actions JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES & UNIQUE CONSTRAINTS
-- =====================================================

-- Índice único parcial para slugs globales (organization_id IS NULL)
CREATE UNIQUE INDEX idx_pipeline_stages_unique_global_slug 
  ON billing.order_pipeline_stages(slug) 
  WHERE organization_id IS NULL;

-- Índice único para slugs por organización
CREATE UNIQUE INDEX idx_pipeline_stages_unique_org_slug 
  ON billing.order_pipeline_stages(organization_id, slug) 
  WHERE organization_id IS NOT NULL;

-- Índices regulares
CREATE INDEX idx_pipeline_stages_org ON billing.order_pipeline_stages(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_pipeline_stages_position ON billing.order_pipeline_stages(position);
CREATE INDEX idx_pipeline_stages_global ON billing.order_pipeline_stages(organization_id) WHERE organization_id IS NULL;

-- =====================================================
-- SEED DEFAULT STAGES (GLOBAL)
-- =====================================================

INSERT INTO billing.order_pipeline_stages (name, slug, position, color, is_final) VALUES
  ('Pendiente de Pago', 'pending_payment', 1, 'yellow', false),
  ('Pagado', 'paid', 2, 'blue', false),
  ('En Proceso', 'processing', 3, 'orange', false),
  ('Completado', 'completed', 4, 'green', true),
  ('Cancelado', 'cancelled', 5, 'gray', true),
  ('Reembolsado', 'refunded', 6, 'red', true);

-- =====================================================
-- VIEWS
-- =====================================================

-- Vista pública para obtener stages globales
CREATE OR REPLACE VIEW public.order_pipeline_stages AS
SELECT 
  id,
  organization_id,
  name,
  slug,
  position,
  color,
  is_final,
  auto_actions,
  created_at
FROM billing.order_pipeline_stages
WHERE organization_id IS NULL -- Solo stages globales
ORDER BY position;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE billing.order_pipeline_stages IS 'Estados configurables del pipeline de pedidos. organization_id NULL = global';
COMMENT ON COLUMN billing.order_pipeline_stages.organization_id IS 'NULL para stages globales, UUID para stages personalizados por organización';
COMMENT ON COLUMN billing.order_pipeline_stages.slug IS 'Identificador único del estado (ej: pending_payment, paid)';
COMMENT ON COLUMN billing.order_pipeline_stages.position IS 'Orden de visualización en el pipeline';
COMMENT ON COLUMN billing.order_pipeline_stages.color IS 'Color para UI (yellow, blue, orange, green, gray, red)';
COMMENT ON COLUMN billing.order_pipeline_stages.is_final IS 'Si true, este es un estado final (no puede avanzar más)';
COMMENT ON COLUMN billing.order_pipeline_stages.auto_actions IS 'JSONB con acciones automáticas cuando se alcanza este estado';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.order_pipeline_stages TO authenticated;
GRANT SELECT ON billing.order_pipeline_stages TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla billing.order_pipeline_stages creada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Stages globales creados:';
  RAISE NOTICE '  1. Pendiente de Pago (pending_payment) - yellow';
  RAISE NOTICE '  2. Pagado (paid) - blue';
  RAISE NOTICE '  3. En Proceso (processing) - orange';
  RAISE NOTICE '  4. Completado (completed) - green [FINAL]';
  RAISE NOTICE '  5. Cancelado (cancelled) - gray [FINAL]';
  RAISE NOTICE '  6. Reembolsado (refunded) - red [FINAL]';
END $$;

