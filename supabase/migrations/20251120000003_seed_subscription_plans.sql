-- =====================================================
-- Migration: Seed de Planes de Suscripción
-- Description: Crear planes base con features y límites para cada tier
-- Created: 2025-11-20
-- =====================================================

-- =====================================================
-- 1. PLAN FREE (Personal)
-- =====================================================

INSERT INTO core.subscription_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  'Free',
  'free',
  'Plan personal gratuito para empezar - Ideal para individuos y freelancers',
  0.00,
  0.00,
  'USD',
  jsonb_build_object(
    'crm', jsonb_build_array(
      'Hasta 100 contactos',
      'Pipeline básico',
      '1 cuenta de email',
      'Campos personalizados',
      'Soporte por email'
    ),
    'storage', jsonb_build_array(
      '1 GB de almacenamiento'
    ),
    'users', jsonb_build_array(
      '1 usuario'
    )
  ),
  jsonb_build_object(
    'crm', jsonb_build_object(
      'max_contacts', 100,
      'max_companies', 50,
      'max_deals', 20,
      'max_tickets', 50,
      'max_email_accounts', 1,
      'custom_fields', true,
      'custom_pipelines', false,
      'automations', false,
      'api_access', false,
      'bulk_actions', false,
      'reports_basic', true,
      'reports_advanced', false,
      'export_data', false
    ),
    'signatures', jsonb_build_object(
      'enabled', false
    ),
    'verifications', jsonb_build_object(
      'enabled', false
    ),
    'ai_customer_service', jsonb_build_object(
      'enabled', false
    ),
    'ai_document_review', jsonb_build_object(
      'enabled', false
    ),
    'storage_gb', 1,
    'max_users', 1,
    'support', 'email'
  ),
  true,
  false,
  1
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits;

-- =====================================================
-- 2. PLAN STARTER (Pequeñas Empresas)
-- =====================================================

INSERT INTO core.subscription_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  'Starter',
  'starter',
  'Plan para pequeñas empresas que empiezan a crecer - Ideal para equipos de 2-5 personas',
  29.00,
  290.00,  -- 2 meses gratis en plan anual
  'USD',
  jsonb_build_object(
    'crm', jsonb_build_array(
      'Hasta 1,000 contactos',
      'Pipelines personalizados',
      '3 cuentas de email',
      'Campos personalizados ilimitados',
      'Automatizaciones básicas',
      'Reportes avanzados',
      'Exportar datos (CSV, Excel)',
      'Soporte prioritario'
    ),
    'signatures', jsonb_build_array(
      '10 documentos/mes',
      'Hasta 3 firmantes',
      'Plantillas básicas'
    ),
    'storage', jsonb_build_array(
      '10 GB de almacenamiento'
    ),
    'users', jsonb_build_array(
      'Hasta 5 usuarios'
    )
  ),
  jsonb_build_object(
    'crm', jsonb_build_object(
      'max_contacts', 1000,
      'max_companies', 500,
      'max_deals', 100,
      'max_tickets', 500,
      'max_email_accounts', 3,
      'custom_fields', true,
      'custom_pipelines', true,
      'automations', true,
      'automations_max', 5,
      'api_access', true,
      'api_calls_per_month', 10000,
      'bulk_actions', true,
      'reports_basic', true,
      'reports_advanced', true,
      'export_data', true
    ),
    'signatures', jsonb_build_object(
      'enabled', true,
      'max_documents_per_month', 10,
      'max_signers_per_document', 3,
      'templates_enabled', true,
      'workflows_enabled', false,
      'api_access', false,
      'custom_branding', false
    ),
    'verifications', jsonb_build_object(
      'enabled', false
    ),
    'ai_customer_service', jsonb_build_object(
      'enabled', false
    ),
    'ai_document_review', jsonb_build_object(
      'enabled', false
    ),
    'storage_gb', 10,
    'max_users', 5,
    'support', 'priority_email'
  ),
  true,
  true,  -- Plan más popular
  2
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits;

-- =====================================================
-- 3. PLAN BUSINESS (Empresas Medianas)
-- =====================================================

INSERT INTO core.subscription_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  'Business',
  'business',
  'Plan para empresas en crecimiento - Ideal para equipos de 6-20 personas',
  99.00,
  990.00,  -- 2 meses gratis en plan anual
  'USD',
  jsonb_build_object(
    'crm', jsonb_build_array(
      'Hasta 10,000 contactos',
      'Pipelines ilimitados',
      '10 cuentas de email',
      'Automatizaciones avanzadas',
      'Inteligencia artificial',
      'Reportes personalizados',
      'Webhooks y API completa',
      'Acciones masivas',
      'Integraciones premium',
      'Soporte chat + email'
    ),
    'signatures', jsonb_build_array(
      '100 documentos/mes',
      'Firmantes ilimitados',
      'Workflows personalizados',
      'Branding personalizado',
      'API de firma'
    ),
    'verifications', jsonb_build_array(
      '50 verificaciones/mes',
      'Verificación de documentos',
      'Reconocimiento facial',
      'Análisis de riesgo'
    ),
    'ai_customer_service', jsonb_build_array(
      '5,000 mensajes/mes',
      'Base de conocimiento 500MB',
      'Entrenamiento personalizado'
    ),
    'storage', jsonb_build_array(
      '100 GB de almacenamiento'
    ),
    'users', jsonb_build_array(
      'Hasta 20 usuarios'
    )
  ),
  jsonb_build_object(
    'crm', jsonb_build_object(
      'max_contacts', 10000,
      'max_companies', 5000,
      'max_deals', 1000,
      'max_tickets', 5000,
      'max_email_accounts', 10,
      'custom_fields', true,
      'custom_pipelines', true,
      'automations', true,
      'automations_max', 50,
      'api_access', true,
      'api_calls_per_month', 100000,
      'bulk_actions', true,
      'reports_basic', true,
      'reports_advanced', true,
      'export_data', true,
      'webhooks', true
    ),
    'signatures', jsonb_build_object(
      'enabled', true,
      'max_documents_per_month', 100,
      'max_signers_per_document', 999,
      'templates_enabled', true,
      'workflows_enabled', true,
      'api_access', true,
      'custom_branding', true,
      'bulk_send', true
    ),
    'verifications', jsonb_build_object(
      'enabled', true,
      'max_verifications_per_month', 50,
      'document_verification', true,
      'facial_recognition', true,
      'liveness_check', false,
      'risk_analysis', true,
      'api_access', true
    ),
    'ai_customer_service', jsonb_build_object(
      'enabled', true,
      'max_messages_per_month', 5000,
      'max_knowledge_base_size_mb', 500,
      'custom_training', true,
      'multilingual', false,
      'handoff_to_human', true,
      'analytics', true,
      'api_access', false
    ),
    'ai_document_review', jsonb_build_object(
      'enabled', false
    ),
    'storage_gb', 100,
    'max_users', 20,
    'support', 'chat_and_email'
  ),
  true,
  false,
  3
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits;

-- =====================================================
-- 4. PLAN ENTERPRISE (Empresas Grandes)
-- =====================================================

INSERT INTO core.subscription_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  'Enterprise',
  'enterprise',
  'Plan personalizado para grandes organizaciones - Todo ilimitado con soporte dedicado',
  299.00,
  2990.00,  -- 2 meses gratis en plan anual
  'USD',
  jsonb_build_object(
    'everything', jsonb_build_array(
      'Todo ilimitado',
      'Contactos ilimitados',
      'Usuarios ilimitados',
      'Storage ilimitado',
      'Todas las aplicaciones incluidas',
      'IA avanzada en todo el sistema',
      'Automatizaciones ilimitadas',
      'API sin límites',
      'Integraciones personalizadas',
      'Onboarding dedicado',
      'Account Manager dedicado',
      'Soporte 24/7 prioritario',
      'SLA garantizado 99.9%',
      'Infraestructura dedicada (opcional)',
      'Cumplimiento normativo avanzado'
    )
  ),
  jsonb_build_object(
    'crm', jsonb_build_object(
      'max_contacts', 999999999,
      'max_companies', 999999999,
      'max_deals', 999999999,
      'max_tickets', 999999999,
      'max_email_accounts', 999,
      'custom_fields', true,
      'custom_pipelines', true,
      'automations', true,
      'automations_max', 999999,
      'api_access', true,
      'api_calls_per_month', 999999999,
      'bulk_actions', true,
      'reports_basic', true,
      'reports_advanced', true,
      'export_data', true,
      'webhooks', true
    ),
    'signatures', jsonb_build_object(
      'enabled', true,
      'max_documents_per_month', 999999999,
      'max_signers_per_document', 999,
      'templates_enabled', true,
      'workflows_enabled', true,
      'api_access', true,
      'custom_branding', true,
      'bulk_send', true
    ),
    'verifications', jsonb_build_object(
      'enabled', true,
      'max_verifications_per_month', 999999999,
      'document_verification', true,
      'facial_recognition', true,
      'liveness_check', true,
      'risk_analysis', true,
      'api_access', true
    ),
    'ai_customer_service', jsonb_build_object(
      'enabled', true,
      'max_messages_per_month', 999999999,
      'max_knowledge_base_size_mb', 999999,
      'custom_training', true,
      'multilingual', true,
      'handoff_to_human', true,
      'analytics', true,
      'api_access', true,
      'custom_branding', true
    ),
    'ai_document_review', jsonb_build_object(
      'enabled', true,
      'max_documents_per_month', 999999999,
      'max_pages_per_document', 999999,
      'clause_detection', true,
      'risk_analysis', true,
      'contract_comparison', true,
      'templates', true,
      'export_reports', true,
      'api_access', true
    ),
    'analytics', jsonb_build_object(
      'enabled', true,
      'custom_dashboards', true,
      'scheduled_reports', true,
      'real_time_metrics', true,
      'data_retention_days', 999999,
      'api_access', true
    ),
    'storage_gb', 999999,
    'max_users', 999999,
    'support', 'dedicated_24_7',
    'sla', '99.9%',
    'dedicated_infrastructure', true,
    'custom_integrations', true,
    'onboarding', 'dedicated',
    'account_manager', true
  ),
  true,
  false,
  4
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  plan_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO plan_count FROM core.subscription_plans;

  RAISE NOTICE '✅ Planes de suscripción creados exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Planes disponibles:';
  RAISE NOTICE '  ✅ Free ($0/mes) - Hasta 100 contactos, 1 usuario';
  RAISE NOTICE '  ⭐ Starter ($29/mes) - Hasta 1,000 contactos, 5 usuarios [MÁS POPULAR]';
  RAISE NOTICE '  ✅ Business ($99/mes) - Hasta 10,000 contactos, 20 usuarios';
  RAISE NOTICE '  ✅ Enterprise ($299/mes) - Todo ilimitado, soporte 24/7';
  RAISE NOTICE '';
  RAISE NOTICE 'Total de planes: %', plan_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Precios anuales:';
  RAISE NOTICE '  - Starter: $290/año (ahorro de $58)';
  RAISE NOTICE '  - Business: $990/año (ahorro de $198)';
  RAISE NOTICE '  - Enterprise: $2,990/año (ahorro de $598)';
  RAISE NOTICE '';
  RAISE NOTICE 'Apps incluidas por plan:';
  RAISE NOTICE '  Free:       CRM (básico)';
  RAISE NOTICE '  Starter:    CRM + Firmas';
  RAISE NOTICE '  Business:   CRM + Firmas + KYC + Chatbot IA';
  RAISE NOTICE '  Enterprise: Todas las apps ilimitadas';
END $$;

