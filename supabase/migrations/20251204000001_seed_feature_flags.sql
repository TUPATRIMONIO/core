-- =====================================================
-- Migration: Seed Inicial de Feature Flags
-- Description: Vincular aplicaciones existentes como feature flags
-- Created: 2025-12-04
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- 1. CREAR FEATURE FLAGS PARA APLICACIONES EXISTENTES
-- =====================================================

-- Marketing Site (público, siempre activo)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  allowed_countries,
  config
) VALUES (
  'marketing_site',
  'Marketing Site',
  'Sitio web público con blog, base de conocimiento y formularios',
  'app',
  true,
  'public',
  ARRAY[]::TEXT[],
  jsonb_build_object(
    'application_slug', 'marketing_site',
    'public_access', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- CRM Sales (público, requiere suscripción)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  required_subscription_tiers,
  config
) VALUES (
  'crm_sales',
  'CRM Sales',
  'Sistema CRM completo con gestión de contactos, empresas, deals y tickets',
  'app',
  true,
  'public',
  ARRAY['starter', 'pro', 'enterprise']::TEXT[],
  jsonb_build_object(
    'application_slug', 'crm_sales',
    'requires_subscription', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Firma Electrónica (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  beta_end_date,
  config
) VALUES (
  'signatures',
  'Firma Electrónica',
  'Servicio de firma electrónica avanzada con workflows personalizables',
  'app',
  false,
  'beta',
  NOW() + INTERVAL '90 days',
  jsonb_build_object(
    'application_slug', 'signatures',
    'beta_testing', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Verificación KYC (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  beta_end_date,
  config
) VALUES (
  'verifications',
  'Verificación de Identidad',
  'Sistema KYC con verificación de identidad y validación de documentos',
  'app',
  false,
  'beta',
  NOW() + INTERVAL '90 days',
  jsonb_build_object(
    'application_slug', 'verifications',
    'beta_testing', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Chatbot IA (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  beta_end_date,
  config
) VALUES (
  'ai_customer_service',
  'Chatbot IA',
  'Chatbot inteligente con RAG para atención al cliente 24/7',
  'app',
  false,
  'beta',
  NOW() + INTERVAL '90 days',
  jsonb_build_object(
    'application_slug', 'ai_customer_service',
    'beta_testing', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Revisión Documentos IA (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  beta_end_date,
  config
) VALUES (
  'ai_document_review',
  'Revisión Documentos IA',
  'Análisis y revisión inteligente de documentos legales con IA',
  'app',
  false,
  'beta',
  NOW() + INTERVAL '90 days',
  jsonb_build_object(
    'application_slug', 'ai_document_review',
    'beta_testing', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Analytics (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  beta_end_date,
  config
) VALUES (
  'analytics',
  'Analytics',
  'Panel de métricas y reportes avanzados con dashboards personalizables',
  'app',
  false,
  'beta',
  NOW() + INTERVAL '90 days',
  jsonb_build_object(
    'application_slug', 'analytics',
    'beta_testing', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- =====================================================
-- 2. FEATURE FLAGS PARA SERVICIOS ESPECÍFICOS
-- =====================================================

-- Firma Electrónica Simple (Chile)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  allowed_countries,
  config
) VALUES (
  'signature_fes',
  'Firma Electrónica Simple',
  'Firma Electrónica Simple (FES) disponible en Chile',
  'service',
  true,
  'public',
  ARRAY['cl']::TEXT[],
  jsonb_build_object(
    'service_type', 'signature',
    'signature_type', 'fes'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Notaría Online (Chile)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  allowed_countries,
  config
) VALUES (
  'notary_online',
  'Notaría Online',
  'Trámites notariales 100% digitales sin filas ni esperas',
  'service',
  true,
  'public',
  ARRAY['cl']::TEXT[],
  jsonb_build_object(
    'service_type', 'notary'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Modificaciones de Empresa (Chile)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  allowed_countries,
  config
) VALUES (
  'company_modifications',
  'Modificaciones de Empresa',
  'Actualiza tu empresa de forma rápida y legal',
  'service',
  true,
  'public',
  ARRAY['cl']::TEXT[],
  jsonb_build_object(
    'service_type', 'company_modifications'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Contrato de Arriendo (Chile)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  allowed_countries,
  config
) VALUES (
  'rental_contract',
  'Contrato de Arriendo',
  'Crea contratos de arriendo listos para firmar',
  'service',
  true,
  'public',
  ARRAY['cl']::TEXT[],
  jsonb_build_object(
    'service_type', 'rental_contract'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- =====================================================
-- 3. FEATURE FLAGS PARA PÁGINAS DE MARKETING
-- =====================================================

-- Legal Tech Landing
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  config
) VALUES (
  'page_legal_tech',
  'Legal Tech Landing',
  'Página de landing para servicios Legal Tech',
  'page',
  true,
  'public',
  jsonb_build_object(
    'page_path', '/legal-tech'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- PropTech Landing (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  config
) VALUES (
  'page_proptech',
  'PropTech Landing',
  'Página de landing para servicios PropTech',
  'page',
  false,
  'beta',
  jsonb_build_object(
    'page_path', '/proptech',
    'show_badge', 'Próximamente'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- FinTech Landing (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  config
) VALUES (
  'page_fintech',
  'FinTech Landing',
  'Página de landing para servicios FinTech',
  'page',
  false,
  'beta',
  jsonb_build_object(
    'page_path', '/fintech',
    'show_badge', 'Próximamente'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Business Hub Landing (beta)
INSERT INTO core.feature_flags (
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  config
) VALUES (
  'page_business_hub',
  'Business Hub Landing',
  'Página de landing para Business Hub',
  'page',
  false,
  'beta',
  jsonb_build_object(
    'page_path', '/business-hub',
    'show_badge', 'Próximamente'
  )
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  app_count INTEGER;
  service_count INTEGER;
  page_count INTEGER;
  total_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO app_count FROM core.feature_flags WHERE category = 'app';
  SELECT COUNT(*) INTO service_count FROM core.feature_flags WHERE category = 'service';
  SELECT COUNT(*) INTO page_count FROM core.feature_flags WHERE category = 'page';
  SELECT COUNT(*) INTO total_count FROM core.feature_flags;
  
  RAISE NOTICE '✅ Feature Flags iniciales creados exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Distribución por categoría:';
  RAISE NOTICE '  📱 Apps: %', app_count;
  RAISE NOTICE '  🔧 Servicios: %', service_count;
  RAISE NOTICE '  📄 Páginas: %', page_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Total de feature flags: %', total_count;
END $$;

