-- =====================================================
-- Migration: Crear Aplicación Email Marketing
-- Description: Registrar aplicación email_marketing para control independiente de comunicaciones
-- Created: 2025-12-05
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- INSERTAR APLICACIÓN EMAIL MARKETING
-- =====================================================

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
  visibility_level,
  config_schema,
  default_config
) VALUES (
  'Email Marketing',
  'email_marketing',
  'Sistema de campañas de email marketing con templates, listas de contactos y analytics',
  '1.0.0',
  'business',
  ARRAY['email', 'marketing', 'campaigns', 'templates', 'lists', 'analytics'],
  true,
  false,
  true,
  'public',
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'max_campaigns_per_month', jsonb_build_object('type', 'integer'),
      'max_contacts_per_list', jsonb_build_object('type', 'integer'),
      'max_templates', jsonb_build_object('type', 'integer'),
      'sendgrid_integration', jsonb_build_object('type', 'boolean'),
      'template_editor', jsonb_build_object('type', 'boolean'),
      'analytics_advanced', jsonb_build_object('type', 'boolean'),
      'a_b_testing', jsonb_build_object('type', 'boolean'),
      'automation', jsonb_build_object('type', 'boolean'),
      'api_access', jsonb_build_object('type', 'boolean')
    )
  ),
  jsonb_build_object(
    'max_campaigns_per_month', 10,
    'max_contacts_per_list', 1000,
    'max_templates', 20,
    'sendgrid_integration', true,
    'template_editor', true,
    'analytics_advanced', false,
    'a_b_testing', false,
    'automation', false,
    'api_access', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  config_schema = EXCLUDED.config_schema,
  default_config = EXCLUDED.default_config,
  visibility_level = EXCLUDED.visibility_level;

COMMENT ON TABLE core.applications IS 'Aplicación Email Marketing agregada para control independiente de comunicaciones';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Aplicación Email Marketing registrada exitosamente';
  RAISE NOTICE '   Slug: email_marketing';
  RAISE NOTICE '   Categoría: business';
  RAISE NOTICE '   Visibilidad: public';
END $$;





