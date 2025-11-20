-- =====================================================
-- Migration: Seed de Aplicaciones del Ecosistema TuPatrimonio
-- Description: Registrar todas las aplicaciones (actuales y roadmap) en core.applications
-- Created: 2025-11-20
-- =====================================================

-- =====================================================
-- 1. APLICACIONES ACTUALES (Implementadas)
-- =====================================================

-- Marketing Site
INSERT INTO core.applications (
  name,
  slug,
  description,
  version,
  category,
  tags,
  is_active,
  is_beta,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'Marketing Site',
  'marketing_site',
  'Sitio web público con blog, base de conocimiento, formularios de contacto y generación de leads',
  '1.0.0',
  'core',
  ARRAY['marketing', 'public', 'blog', 'kb', 'leads'],
  true,
  false,
  false,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'site_url', jsonb_build_object('type', 'string'),
      'blog_enabled', jsonb_build_object('type', 'boolean'),
      'kb_enabled', jsonb_build_object('type', 'boolean'),
      'contact_form_enabled', jsonb_build_object('type', 'boolean'),
      'newsletter_enabled', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'blog_enabled', true,
    'kb_enabled', true,
    'contact_form_enabled', true,
    'newsletter_enabled', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  config_schema = EXCLUDED.config_schema,
  default_config = EXCLUDED.default_config;

-- CRM Sales
INSERT INTO core.applications (
  name,
  slug,
  description,
  version,
  category,
  tags,
  is_active,
  is_beta,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'CRM Sales',
  'crm_sales',
  'Sistema CRM completo con gestión de contactos, empresas, deals, tickets, cotizaciones, email multi-cuenta y pipeline personalizable',
  '1.0.0',
  'business',
  ARRAY['crm', 'sales', 'contacts', 'deals', 'tickets', 'email'],
  true,
  false,
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'max_contacts', jsonb_build_object('type', 'integer'),
      'max_users', jsonb_build_object('type', 'integer'),
      'max_email_accounts', jsonb_build_object('type', 'integer'),
      'email_integration', jsonb_build_object('type', 'boolean'),
      'custom_fields', jsonb_build_object('type', 'boolean'),
      'custom_pipelines', jsonb_build_object('type', 'boolean'),
      'api_access', jsonb_build_object('type', 'boolean'),
      'automations', jsonb_build_object('type', 'boolean'),
      'bulk_actions', jsonb_build_object('type', 'boolean'),
      'reports_advanced', jsonb_build_object('type', 'boolean'),
      'export_data', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'max_contacts', 100,
    'max_users', 1,
    'max_email_accounts', 1,
    'email_integration', true,
    'custom_fields', true,
    'custom_pipelines', false,
    'api_access', false,
    'automations', false,
    'bulk_actions', false,
    'reports_advanced', false,
    'export_data', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  config_schema = EXCLUDED.config_schema,
  default_config = EXCLUDED.default_config;

-- =====================================================
-- 2. APLICACIONES ROADMAP (Futuras)
-- =====================================================

-- Firma Electrónica
INSERT INTO core.applications (
  name,
  slug,
  description,
  version,
  category,
  tags,
  is_active,
  is_beta,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'Firma Electrónica',
  'signatures',
  'Servicio de firma electrónica avanzada con workflows personalizables, plantillas y certificados digitales',
  '0.1.0',
  'business',
  ARRAY['signatures', 'legal', 'documents', 'workflows'],
  false,
  true,
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'max_documents_per_month', jsonb_build_object('type', 'integer'),
      'max_signers_per_document', jsonb_build_object('type', 'integer'),
      'templates_enabled', jsonb_build_object('type', 'boolean'),
      'workflows_enabled', jsonb_build_object('type', 'boolean'),
      'api_access', jsonb_build_object('type', 'boolean'),
      'custom_branding', jsonb_build_object('type', 'boolean'),
      'audit_trail', jsonb_build_object('type', 'boolean'),
      'bulk_send', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'max_documents_per_month', 10,
    'max_signers_per_document', 3,
    'templates_enabled', false,
    'workflows_enabled', false,
    'api_access', false,
    'custom_branding', false,
    'audit_trail', true,
    'bulk_send', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version;

-- Verificación de Identidad (KYC)
INSERT INTO core.applications (
  name,
  slug,
  description,
  version,
  category,
  tags,
  is_active,
  is_beta,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'Verificación de Identidad',
  'verifications',
  'Sistema KYC (Know Your Customer) con verificación de identidad, validación de documentos y análisis de riesgo',
  '0.1.0',
  'business',
  ARRAY['kyc', 'identity', 'verification', 'compliance'],
  false,
  true,
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'max_verifications_per_month', jsonb_build_object('type', 'integer'),
      'document_verification', jsonb_build_object('type', 'boolean'),
      'facial_recognition', jsonb_build_object('type', 'boolean'),
      'liveness_check', jsonb_build_object('type', 'boolean'),
      'risk_analysis', jsonb_build_object('type', 'boolean'),
      'api_access', jsonb_build_object('type', 'boolean'),
      'webhook_notifications', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'max_verifications_per_month', 50,
    'document_verification', true,
    'facial_recognition', false,
    'liveness_check', false,
    'risk_analysis', false,
    'api_access', false,
    'webhook_notifications', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version;

-- Chatbot IA con RAG
INSERT INTO core.applications (
  name,
  slug,
  description,
  version,
  category,
  tags,
  is_active,
  is_beta,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'Chatbot IA',
  'ai_customer_service',
  'Chatbot inteligente con RAG (Retrieval Augmented Generation) para atención al cliente 24/7 con base de conocimiento personalizada',
  '0.1.0',
  'ai',
  ARRAY['ai', 'chatbot', 'rag', 'support', 'nlp'],
  false,
  true,
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'max_messages_per_month', jsonb_build_object('type', 'integer'),
      'max_knowledge_base_size_mb', jsonb_build_object('type', 'integer'),
      'custom_training', jsonb_build_object('type', 'boolean'),
      'multilingual', jsonb_build_object('type', 'boolean'),
      'handoff_to_human', jsonb_build_object('type', 'boolean'),
      'analytics', jsonb_build_object('type', 'boolean'),
      'api_access', jsonb_build_object('type', 'boolean'),
      'custom_branding', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'max_messages_per_month', 1000,
    'max_knowledge_base_size_mb', 100,
    'custom_training', false,
    'multilingual', false,
    'handoff_to_human', true,
    'analytics', true,
    'api_access', false,
    'custom_branding', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version;

-- Revisión de Documentos con IA
INSERT INTO core.applications (
  name,
  slug,
  description,
  version,
  category,
  tags,
  is_active,
  is_beta,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'Revisión Documentos IA',
  'ai_document_review',
  'Análisis y revisión inteligente de documentos legales con IA: detección de cláusulas, riesgos y comparación de contratos',
  '0.1.0',
  'ai',
  ARRAY['ai', 'documents', 'legal', 'nlp', 'analysis'],
  false,
  true,
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'max_documents_per_month', jsonb_build_object('type', 'integer'),
      'max_pages_per_document', jsonb_build_object('type', 'integer'),
      'clause_detection', jsonb_build_object('type', 'boolean'),
      'risk_analysis', jsonb_build_object('type', 'boolean'),
      'contract_comparison', jsonb_build_object('type', 'boolean'),
      'templates', jsonb_build_object('type', 'boolean'),
      'export_reports', jsonb_build_object('type', 'boolean'),
      'api_access', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'max_documents_per_month', 20,
    'max_pages_per_document', 50,
    'clause_detection', true,
    'risk_analysis', false,
    'contract_comparison', false,
    'templates', false,
    'export_reports', true,
    'api_access', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version;

-- Analytics y Reportes
INSERT INTO core.applications (
  name,
  slug,
  description,
  version,
  category,
  tags,
  is_active,
  is_beta,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'Analytics',
  'analytics',
  'Panel de métricas y reportes avanzados para todas las aplicaciones del ecosistema con dashboards personalizables',
  '0.1.0',
  'analytics',
  ARRAY['analytics', 'metrics', 'reports', 'dashboards', 'bi'],
  false,
  true,
  true,
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'custom_dashboards', jsonb_build_object('type', 'boolean'),
      'scheduled_reports', jsonb_build_object('type', 'boolean'),
      'export_formats', jsonb_build_object('type', 'array'),
      'real_time_metrics', jsonb_build_object('type', 'boolean'),
      'data_retention_days', jsonb_build_object('type', 'integer'),
      'api_access', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'custom_dashboards', false,
    'scheduled_reports', false,
    'export_formats', ARRAY['pdf', 'csv'],
    'real_time_metrics', false,
    'data_retention_days', 90,
    'api_access', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  active_count INTEGER;
  beta_count INTEGER;
  total_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO active_count FROM core.applications WHERE is_active = true;
  SELECT COUNT(*) INTO beta_count FROM core.applications WHERE is_beta = true;
  SELECT COUNT(*) INTO total_count FROM core.applications;

  RAISE NOTICE '✅ Aplicaciones del ecosistema registradas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Aplicaciones ACTIVAS (%) - Listas para usar:', active_count;
  RAISE NOTICE '  ✅ Marketing Site';
  RAISE NOTICE '  ✅ CRM Sales';
  RAISE NOTICE '';
  RAISE NOTICE 'Aplicaciones EN BETA (%) - En desarrollo:', beta_count;
  RAISE NOTICE '  🚧 Firma Electrónica';
  RAISE NOTICE '  🚧 Verificación de Identidad';
  RAISE NOTICE '  🚧 Chatbot IA';
  RAISE NOTICE '  🚧 Revisión Documentos IA';
  RAISE NOTICE '  🚧 Analytics';
  RAISE NOTICE '';
  RAISE NOTICE 'Total de aplicaciones: %', total_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Categorías:';
  RAISE NOTICE '  - core: % apps', (SELECT COUNT(*) FROM core.applications WHERE category = 'core');
  RAISE NOTICE '  - business: % apps', (SELECT COUNT(*) FROM core.applications WHERE category = 'business');
  RAISE NOTICE '  - ai: % apps', (SELECT COUNT(*) FROM core.applications WHERE category = 'ai');
  RAISE NOTICE '  - analytics: % apps', (SELECT COUNT(*) FROM core.applications WHERE category = 'analytics');
END $$;

