-- =====================================================
-- Migration: Seed Credits and Billing Data
-- Description: Datos iniciales para paquetes de créditos, precios de operaciones IA y tasas de impuestos
-- Created: 2025-11-21
-- =====================================================

SET search_path TO credits, billing, core, public, extensions;

-- =====================================================
-- CREDIT PACKAGES
-- =====================================================

INSERT INTO credits.credit_packages (
  name,
  slug,
  description,
  credits_amount,
  price_usd,
  price_clp,
  price_ars,
  price_cop,
  price_mxn,
  price_pen,
  is_active,
  sort_order
) VALUES
-- Paquete Básico
(
  'Paquete Básico',
  'basic',
  'Ideal para empezar - 500 créditos',
  500.00,
  9.99,
  9500.00,  -- ~950 CLP por USD
  8500.00,  -- ~850 ARS por USD
  42000.00, -- ~4200 COP por USD
  180.00,   -- ~18 MXN por USD
  37.00,    -- ~3.7 PEN por USD
  true,
  1
),
-- Paquete Estándar
(
  'Paquete Estándar',
  'standard',
  'Para uso regular - 2,000 créditos',
  2000.00,
  34.99,
  33250.00,
  29750.00,
  147000.00,
  630.00,
  130.00,
  true,
  2
),
-- Paquete Profesional
(
  'Paquete Profesional',
  'professional',
  'Para equipos - 5,000 créditos',
  5000.00,
  79.99,
  75950.00,
  67950.00,
  336000.00,
  1440.00,
  296.00,
  true,
  3
),
-- Paquete Empresarial
(
  'Paquete Empresarial',
  'enterprise',
  'Para empresas - 15,000 créditos',
  15000.00,
  199.99,
  189950.00,
  169950.00,
  840000.00,
  3600.00,
  740.00,
  true,
  4
),
-- Paquete Premium
(
  'Paquete Premium',
  'premium',
  'Máximo valor - 50,000 créditos',
  50000.00,
  599.99,
  569950.00,
  509950.00,
  2520000.00,
  10800.00,
  2220.00,
  true,
  5
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits_amount = EXCLUDED.credits_amount,
  price_usd = EXCLUDED.price_usd,
  price_clp = EXCLUDED.price_clp,
  price_ars = EXCLUDED.price_ars,
  price_cop = EXCLUDED.price_cop,
  price_mxn = EXCLUDED.price_mxn,
  price_pen = EXCLUDED.price_pen;

-- =====================================================
-- CREDIT PRICES (Precios por operación de servicios IA)
-- =====================================================

INSERT INTO credits.credit_prices (
  service_code,
  application_code,
  operation,
  credit_cost,
  description
) VALUES
-- AI Customer Service
(
  'ai_chat_message',
  'ai_customer_service',
  'send_message',
  0.5,
  'Mensaje de chat básico (sin base de conocimiento)'
),
(
  'ai_chat_message_kb',
  'ai_customer_service',
  'send_message_with_kb',
  1.0,
  'Mensaje de chat con búsqueda en base de conocimiento'
),
-- AI Document Review
(
  'ai_document_review_page',
  'ai_document_review',
  'review_page',
  2.0,
  'Revisión de una página de documento'
),
(
  'ai_document_review_full',
  'ai_document_review',
  'review_document',
  10.0,
  'Revisión completa de documento'
),
(
  'ai_document_compare',
  'ai_document_review',
  'compare_documents',
  15.0,
  'Comparación entre dos documentos'
)
ON CONFLICT (service_code, operation) DO UPDATE SET
  application_code = EXCLUDED.application_code,
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description;

-- =====================================================
-- TAX RATES (Tasas de impuestos por país)
-- =====================================================

INSERT INTO billing.tax_rates (
  country_code,
  rate,
  tax_name,
  is_active
) VALUES
-- Chile
('CL', 0.19, 'IVA', true),
-- Argentina
('AR', 0.21, 'IVA', true),
-- Colombia
('CO', 0.19, 'IVA', true),
-- México
('MX', 0.16, 'IVA', true),
-- Perú
('PE', 0.18, 'IGV', true),
-- Estados Unidos (sin impuesto federal, pero algunos estados tienen)
('US', 0.00, 'Sales Tax', true),
-- Otros países LATAM comunes
('UY', 0.22, 'IVA', true), -- Uruguay
('PY', 0.10, 'IVA', true), -- Paraguay
('BO', 0.13, 'IVA', true), -- Bolivia
('EC', 0.12, 'IVA', true), -- Ecuador
('VE', 0.16, 'IVA', true)  -- Venezuela
ON CONFLICT (country_code, tax_name) DO UPDATE SET
  rate = EXCLUDED.rate,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  package_count INTEGER;
  price_count INTEGER;
  tax_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO package_count FROM credits.credit_packages WHERE is_active = true;
  SELECT COUNT(*) INTO price_count FROM credits.credit_prices;
  SELECT COUNT(*) INTO tax_count FROM billing.tax_rates WHERE is_active = true;
  
  RAISE NOTICE '✅ Seed data creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Paquetes de créditos: %', package_count;
  RAISE NOTICE '  ✅ Paquete Básico - 500 créditos ($9.99 USD)';
  RAISE NOTICE '  ✅ Paquete Estándar - 2,000 créditos ($34.99 USD)';
  RAISE NOTICE '  ✅ Paquete Profesional - 5,000 créditos ($79.99 USD)';
  RAISE NOTICE '  ✅ Paquete Empresarial - 15,000 créditos ($199.99 USD)';
  RAISE NOTICE '  ✅ Paquete Premium - 50,000 créditos ($599.99 USD)';
  RAISE NOTICE '';
  RAISE NOTICE 'Precios de operaciones IA: %', price_count;
  RAISE NOTICE '  ✅ ai_chat_message - 0.5 créditos';
  RAISE NOTICE '  ✅ ai_chat_message_kb - 1.0 créditos';
  RAISE NOTICE '  ✅ ai_document_review_page - 2.0 créditos';
  RAISE NOTICE '  ✅ ai_document_review_full - 10.0 créditos';
  RAISE NOTICE '  ✅ ai_document_compare - 15.0 créditos';
  RAISE NOTICE '';
  RAISE NOTICE 'Tasas de impuestos: %', tax_count;
  RAISE NOTICE '  ✅ CL (Chile) - 19%% IVA';
  RAISE NOTICE '  ✅ AR (Argentina) - 21%% IVA';
  RAISE NOTICE '  ✅ CO (Colombia) - 19%% IVA';
  RAISE NOTICE '  ✅ MX (México) - 16%% IVA';
  RAISE NOTICE '  ✅ PE (Perú) - 18%% IGV';
END $$;

