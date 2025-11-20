-- Migration: Seed Initial Data
-- Description: Datos iniciales necesarios para el funcionamiento de la aplicación
-- Created: 2025-11-19

-- =====================================================
-- 0. AGREGAR COLUMNA is_personal SI NO EXISTE
-- =====================================================

ALTER TABLE core.organizations
ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT false;

-- =====================================================
-- 1. PAQUETES DE CRÉDITOS
-- =====================================================

INSERT INTO core.credit_packages (name, slug, description, credits, bonus_credits, is_active, is_popular, sort_order)
VALUES
  ('Starter', 'starter', 'Paquete ideal para empezar', 100, 0, true, false, 1),
  ('Pro', 'pro', 'Para uso frecuente', 500, 50, true, true, 2),
  ('Business', 'business', 'Para equipos y empresas', 1000, 150, true, false, 3),
  ('Enterprise', 'enterprise', 'Volumen alto con máximo descuento', 5000, 1000, true, false, 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  is_popular = EXCLUDED.is_popular;

-- =====================================================
-- 2. PRECIOS DE PAQUETES (MULTIMONEDA)
-- =====================================================

-- Obtener IDs de paquetes
DO $$
DECLARE
  starter_id UUID;
  pro_id UUID;
  business_id UUID;
  enterprise_id UUID;
BEGIN
  SELECT id INTO starter_id FROM core.credit_packages WHERE slug = 'starter';
  SELECT id INTO pro_id FROM core.credit_packages WHERE slug = 'pro';
  SELECT id INTO business_id FROM core.credit_packages WHERE slug = 'business';
  SELECT id INTO enterprise_id FROM core.credit_packages WHERE slug = 'enterprise';

  -- Precios en CLP
  INSERT INTO core.credit_package_prices (package_id, currency, price)
  VALUES
    (starter_id, 'CLP', 999000),    -- $9.990
    (pro_id, 'CLP', 4990000),       -- $49.900
    (business_id, 'CLP', 8990000),  -- $89.900
    (enterprise_id, 'CLP', 39900000) -- $399.000
  ON CONFLICT (package_id, currency) DO UPDATE SET price = EXCLUDED.price;

  -- Precios en USD
  INSERT INTO core.credit_package_prices (package_id, currency, price)
  VALUES
    (starter_id, 'USD', 1200),    -- $12.00
    (pro_id, 'USD', 5900),        -- $59.00
    (business_id, 'USD', 10900),  -- $109.00
    (enterprise_id, 'USD', 49900) -- $499.00
  ON CONFLICT (package_id, currency) DO UPDATE SET price = EXCLUDED.price;

  -- Precios en MXN
  INSERT INTO core.credit_package_prices (package_id, currency, price)
  VALUES
    (starter_id, 'MXN', 21900),    -- $219.00
    (pro_id, 'MXN', 104900),       -- $1,049.00
    (business_id, 'MXN', 194900),  -- $1,949.00
    (enterprise_id, 'MXN', 889900) -- $8,899.00
  ON CONFLICT (package_id, currency) DO UPDATE SET price = EXCLUDED.price;
END $$;

-- =====================================================
-- 3. PROVEEDORES DE PAGO
-- =====================================================

INSERT INTO core.payment_providers (name, slug, supported_countries, supported_currencies, is_active)
VALUES
  (
    'Stripe',
    'stripe',
    ARRAY['US', 'CL', 'MX', 'CO', 'PE', 'AR'],
    ARRAY['USD', 'CLP', 'MXN', 'COP', 'PEN', 'ARS'],
    true
  ),
  (
    'DLocalGo',
    'dlocalgo',
    ARRAY['CL', 'MX', 'CO', 'PE', 'AR', 'BR'],
    ARRAY['CLP', 'MXN', 'COP', 'PEN', 'ARS', 'BRL'],
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  supported_countries = EXCLUDED.supported_countries,
  supported_currencies = EXCLUDED.supported_currencies,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- 4. PROVEEDORES DE FIRMA
-- =====================================================

INSERT INTO signatures.providers (name, slug, supported_types, is_active)
VALUES
  (
    'Certificadora del Sur',
    'certificadora-sur',
    ARRAY['fea']::signatures.signature_type[],
    true
  ),
  (
    'TuPatrimonio Simple',
    'tupatrimonio-simple',
    ARRAY['fes', 'fes_biometric', 'fes_clave_unica']::signatures.signature_type[],
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  supported_types = EXCLUDED.supported_types,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- 5. TIPOS DE SERVICIOS NOTARIALES
-- =====================================================

INSERT INTO notary.service_types (name, slug, description, base_price, requires_document, is_active, sort_order)
VALUES
  ('Copia Certificada', 'copia-certificada', 'Copia certificada de documento', 8990, true, true, 1),
  ('Protocolización', 'protocolizacion', 'Protocolización de documento', 15990, true, true, 2),
  ('Firma Ante Notario (FAN)', 'fan', 'Firma ante notario presencial', 9990, true, true, 3),
  ('Escritura Pública', 'escritura-publica', 'Redacción y firma de escritura pública', 25990, true, true, 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  requires_document = EXCLUDED.requires_document;

-- =====================================================
-- 6. PRODUCTOS (CATÁLOGO)
-- =====================================================

INSERT INTO core.products (name, slug, type, credit_price, credit_discount_percent, is_active)
VALUES
  -- Firmas
  ('FES - Firma Electrónica Simple', 'fes', 'signature', 70, 10, true),
  ('FES Biométrica', 'fes-biometric', 'signature', 80, 10, true),
  ('FES Clave Única', 'fes-clave-unica', 'signature', 80, 10, true),
  ('FEA - Firma Electrónica Avanzada', 'fea', 'signature', 90, 10, true),
  
  -- Servicios notariales
  ('Copia Certificada', 'notary-copia-certificada', 'notary_service', 90, 5, true),
  ('Protocolización', 'notary-protocolizacion', 'notary_service', 160, 5, true),
  ('FAN', 'notary-fan', 'notary_service', 100, 5, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  credit_price = EXCLUDED.credit_price,
  credit_discount_percent = EXCLUDED.credit_discount_percent;

-- =====================================================
-- 7. PRECIOS DE PRODUCTOS (MULTIMONEDA)
-- =====================================================

DO $$
DECLARE
  product_record RECORD;
BEGIN
  FOR product_record IN SELECT id, slug FROM core.products LOOP
    IF product_record.slug = 'fes' THEN
      INSERT INTO core.product_prices (product_id, currency, price)
      VALUES (product_record.id, 'CLP', 699000) -- $6.990
      ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

    ELSIF product_record.slug = 'fes-biometric' THEN
      INSERT INTO core.product_prices (product_id, currency, price)
      VALUES (product_record.id, 'CLP', 799000) -- $7.990
      ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

    ELSIF product_record.slug = 'fes-clave-unica' THEN
      INSERT INTO core.product_prices (product_id, currency, price)
      VALUES (product_record.id, 'CLP', 799000) -- $7.990
      ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

    ELSIF product_record.slug = 'fea' THEN
      INSERT INTO core.product_prices (product_id, currency, price)
      VALUES (product_record.id, 'CLP', 899000) -- $8.990
      ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

    ELSIF product_record.slug = 'notary-copia-certificada' THEN
      INSERT INTO core.product_prices (product_id, currency, price)
      VALUES (product_record.id, 'CLP', 899000) -- $8.990
      ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

    ELSIF product_record.slug = 'notary-protocolizacion' THEN
      INSERT INTO core.product_prices (product_id, currency, price)
      VALUES (product_record.id, 'CLP', 1599000) -- $15.990
      ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

    ELSIF product_record.slug = 'notary-fan' THEN
      INSERT INTO core.product_prices (product_id, currency, price)
      VALUES (product_record.id, 'CLP', 999000) -- $9.990
      ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 8. NOTARÍAS DE EJEMPLO (SOLO PARA TESTING)
-- =====================================================

-- Crear organización de notaría de ejemplo
DO $$
DECLARE
  notary_org_id UUID;
BEGIN
  INSERT INTO core.organizations (name, slug, org_type, status, email, is_personal)
  VALUES (
    'Notaría de Ejemplo Santiago',
    'notaria-ejemplo-santiago',
    'notary',
    'active',
    'notaria@ejemplo.cl',
    false
  )
  RETURNING id INTO notary_org_id;

  -- Crear registro en notaries
  INSERT INTO notary.notaries (
    id,
    name,
    notary_name,
    city,
    region,
    email,
    phone,
    address,
    is_active
  ) VALUES (
    notary_org_id,
    'Notaría de Ejemplo',
    'Juan Pérez Notario',
    'Santiago',
    'Región Metropolitana',
    'notaria@ejemplo.cl',
    '+56 2 2345 6789',
    'Av. Providencia 1234, Oficina 567',
    true
  );
END $$;

-- =====================================================
-- 9. RESUMEN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Datos iniciales creados';
  RAISE NOTICE '';
  RAISE NOTICE 'Paquetes de créditos:';
  RAISE NOTICE '  ✅ Starter (100 créditos) - $9.990 CLP';
  RAISE NOTICE '  ✅ Pro (550 créditos) - $49.900 CLP';
  RAISE NOTICE '  ✅ Business (1.150 créditos) - $89.900 CLP';
  RAISE NOTICE '  ✅ Enterprise (6.000 créditos) - $399.000 CLP';
  RAISE NOTICE '';
  RAISE NOTICE 'Proveedores de pago:';
  RAISE NOTICE '  ✅ Stripe (Internacional)';
  RAISE NOTICE '  ✅ DLocalGo (LATAM)';
  RAISE NOTICE '';
  RAISE NOTICE 'Proveedores de firma:';
  RAISE NOTICE '  ✅ Certificadora del Sur (FEA)';
  RAISE NOTICE '  ✅ TuPatrimonio Simple (FES)';
  RAISE NOTICE '';
  RAISE NOTICE 'Servicios notariales:';
  RAISE NOTICE '  ✅ Copia Certificada - $8.990';
  RAISE NOTICE '  ✅ Protocolización - $15.990';
  RAISE NOTICE '  ✅ FAN - $9.990';
  RAISE NOTICE '  ✅ Escritura Pública - $25.990';
  RAISE NOTICE '';
  RAISE NOTICE 'Precios de productos:';
  RAISE NOTICE '  ✅ FES - $6.990 (70 créditos)';
  RAISE NOTICE '  ✅ FES Biométrica - $7.990 (80 créditos)';
  RAISE NOTICE '  ✅ FES Clave Única - $7.990 (80 créditos)';
  RAISE NOTICE '  ✅ FEA - $8.990 (90 créditos)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  - Notaría de ejemplo creada para testing';
  RAISE NOTICE '  - Eliminar en producción';
  RAISE NOTICE '  - Configurar APIs reales de proveedores';
END $$;

