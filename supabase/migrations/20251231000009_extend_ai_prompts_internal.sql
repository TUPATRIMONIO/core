-- =====================================================
-- Migration: Extend ai_prompts for internal review
-- Description: Agrega campos para distinguir prompts internos y filtrar por servicio/tipo documento
-- Created: 2025-12-31
-- =====================================================

SET search_path TO public, signing, core, extensions;

-- =====================================================
-- 1. Agregar columnas a ai_prompts
-- =====================================================

-- Columna para distinguir si es revisión interna (sin costo) o pagada
ALTER TABLE public.ai_prompts
  ADD COLUMN IF NOT EXISTS is_internal_review BOOLEAN NOT NULL DEFAULT false;

-- Columna para filtrar por tipo de servicio (ej: 'fea_cl', 'protocolization_cl', NULL para genérico)
ALTER TABLE public.ai_prompts
  ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Columna para filtrar por tipo de documento legal (ej: 'contrato', 'poder', NULL para genérico)
ALTER TABLE public.ai_prompts
  ADD COLUMN IF NOT EXISTS document_type TEXT;

-- =====================================================
-- 2. Actualizar índice único para permitir múltiples prompts activos
-- =====================================================

-- Eliminar índice único anterior (solo por feature_type + country_code)
DROP INDEX IF EXISTS unique_active_prompt;

-- Crear nuevo índice único que incluye los nuevos campos
-- Permite múltiples prompts activos si difieren en service_type o document_type
CREATE UNIQUE INDEX unique_active_prompt ON public.ai_prompts (
  feature_type, 
  country_code, 
  COALESCE(is_internal_review, false),
  COALESCE(service_type, ''),
  COALESCE(document_type, '')
) WHERE is_active = true;

-- =====================================================
-- 3. Actualizar índices existentes para incluir nuevos campos
-- =====================================================

-- Índice para búsqueda por tipo de servicio
CREATE INDEX IF NOT EXISTS idx_ai_prompts_service_type 
  ON public.ai_prompts(service_type) 
  WHERE service_type IS NOT NULL AND is_active = true;

-- Índice para búsqueda por tipo de documento
CREATE INDEX IF NOT EXISTS idx_ai_prompts_document_type 
  ON public.ai_prompts(document_type) 
  WHERE document_type IS NOT NULL AND is_active = true;

-- Índice compuesto para búsqueda de prompts internos
CREATE INDEX IF NOT EXISTS idx_ai_prompts_internal 
  ON public.ai_prompts(feature_type, country_code, is_internal_review, service_type, document_type) 
  WHERE is_active = true AND is_internal_review = true;

-- =====================================================
-- 4. Actualizar constraint UNIQUE existente
-- =====================================================

-- El constraint UNIQUE original es por (feature_type, country_code, version)
-- Necesitamos actualizarlo para incluir los nuevos campos opcionales
-- Pero version ya es parte del unique, así que mantenemos el constraint original
-- y el índice único manejará la unicidad de prompts activos

-- =====================================================
-- 5. Comentarios
-- =====================================================

COMMENT ON COLUMN public.ai_prompts.is_internal_review IS 
  'Si es true, es una revisión interna post-pago (sin costo). Si es false, es revisión pagada con créditos.';

COMMENT ON COLUMN public.ai_prompts.service_type IS 
  'Tipo de servicio específico (ej: fea_cl, protocolization_cl). NULL para prompts genéricos que aplican a todos los servicios.';

COMMENT ON COLUMN public.ai_prompts.document_type IS 
  'Tipo de documento legal específico (ej: contrato, poder). NULL para prompts genéricos que aplican a todos los tipos.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tabla ai_prompts extendida para soportar revisión interna';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevas columnas agregadas:';
  RAISE NOTICE '  - is_internal_review (BOOLEAN)';
  RAISE NOTICE '  - service_type (TEXT)';
  RAISE NOTICE '  - document_type (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Índices actualizados para soportar búsquedas por:';
  RAISE NOTICE '  - Tipo de servicio';
  RAISE NOTICE '  - Tipo de documento';
  RAISE NOTICE '  - Prompts internos';
END $$;

