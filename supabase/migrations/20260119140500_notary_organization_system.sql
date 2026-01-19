-- =====================================================
-- Migration: Notary organization system
-- Description: Adds notary org type, approval fields, and RPC creation
-- Created: 2026-01-19
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- 1. EXTEND ORG_TYPE CONSTRAINT
-- =====================================================

ALTER TABLE core.organizations
DROP CONSTRAINT IF EXISTS organizations_org_type_check;

ALTER TABLE core.organizations
ADD CONSTRAINT organizations_org_type_check
CHECK (org_type IN ('personal', 'business', 'platform', 'notary'));

COMMENT ON COLUMN core.organizations.org_type IS
'Tipo de organización: personal (B2C), business (B2B), notary (Notaría), platform (TuPatrimonio admins)';

-- =====================================================
-- 2. NOTARY OFFICES APPROVAL FIELDS
-- =====================================================

ALTER TABLE signing.notary_offices
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES core.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_notary_offices_approval_status
  ON signing.notary_offices(approval_status);

-- =====================================================
-- 3. UPDATE ASSIGNMENT TO FILTER APPROVED NOTARIES
-- =====================================================

CREATE OR REPLACE FUNCTION signing.assign_document_to_notary(
  p_document_id UUID,
  p_product_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
  v_country TEXT;
  v_total_weight INTEGER;
  v_random_pick INTEGER;
  v_cumulative INTEGER := 0;
  v_row RECORD;
  v_selected_office_id UUID;
BEGIN
  PERFORM set_config('search_path', 'signing,core,public,extensions', true);

  -- Lock documento
  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF NOT signing.user_belongs_to_org(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Determinar país (metadata country_code o country de la organización)
  v_country := UPPER(COALESCE(v_doc.metadata->>'country_code', (SELECT country FROM core.organizations WHERE id = v_doc.organization_id), 'CL'));

  -- Validar producto (debe ser notary_service y del mismo país)
  IF NOT EXISTS (
    SELECT 1
    FROM signing.products p
    WHERE p.id = p_product_id
      AND p.category = 'notary_service'
      AND UPPER(p.country_code) = v_country
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid notary product for country %', v_country;
  END IF;

  -- Calcular peso total (solo notarías aprobadas)
  SELECT COALESCE(SUM(ns.weight), 0)
  INTO v_total_weight
  FROM signing.notary_services ns
  JOIN signing.notary_offices no ON no.id = ns.notary_office_id
  WHERE ns.product_id = p_product_id
    AND ns.is_active = true
    AND no.is_active = true
    AND no.accepts_new_documents = true
    AND no.approval_status = 'approved'
    AND UPPER(no.country_code) = v_country
    AND (ns.max_daily_documents IS NULL OR ns.current_daily_count < ns.max_daily_documents);

  IF v_total_weight <= 0 THEN
    RAISE EXCEPTION 'No hay notarías disponibles para este servicio en %', v_country;
  END IF;

  v_random_pick := floor(random() * v_total_weight) + 1;

  FOR v_row IN (
    SELECT ns.id AS notary_service_id, ns.notary_office_id, ns.weight
    FROM signing.notary_services ns
    JOIN signing.notary_offices no ON no.id = ns.notary_office_id
    WHERE ns.product_id = p_product_id
      AND ns.is_active = true
      AND no.is_active = true
      AND no.accepts_new_documents = true
      AND no.approval_status = 'approved'
      AND UPPER(no.country_code) = v_country
      AND (ns.max_daily_documents IS NULL OR ns.current_daily_count < ns.max_daily_documents)
    ORDER BY ns.notary_office_id
    FOR UPDATE
  ) LOOP
    v_cumulative := v_cumulative + v_row.weight;

    IF v_cumulative >= v_random_pick THEN
      v_selected_office_id := v_row.notary_office_id;

      UPDATE signing.notary_services
      SET current_daily_count = current_daily_count + 1,
          updated_at = NOW()
      WHERE id = v_row.notary_service_id;

      EXIT;
    END IF;
  END LOOP;

  IF v_selected_office_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo asignar notaría (selección vacía)';
  END IF;

  INSERT INTO signing.notary_assignments (document_id, notary_office_id, product_id, status)
  VALUES (p_document_id, v_selected_office_id, p_product_id, 'pending')
  ON CONFLICT (document_id) DO UPDATE SET
    notary_office_id = EXCLUDED.notary_office_id,
    product_id = EXCLUDED.product_id,
    status = 'pending',
    assigned_at = NOW(),
    updated_at = NOW();

  UPDATE signing.documents
  SET status = 'pending_notary',
      updated_at = NOW()
  WHERE id = p_document_id;

  RETURN v_selected_office_id;
END;
$$;

-- =====================================================
-- 4. RPC: CREATE NOTARY ORGANIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notary_organization(
  user_id UUID,
  user_email TEXT,
  org_name TEXT,
  notary_country_code TEXT,
  notary_city TEXT,
  notary_address TEXT,
  notary_email TEXT,
  notary_phone TEXT
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  owner_role_id UUID;
  safe_slug TEXT;
BEGIN
  -- Crear entrada en core.users si no existe
  INSERT INTO core.users (id, status)
  VALUES (
    create_notary_organization.user_id,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

  -- Generar slug seguro desde nombre de notaría
  safe_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  safe_slug := regexp_replace(safe_slug, '^-+|-+$', '', 'g');
  safe_slug := substring(safe_slug, 1, 50);

  -- Hacer slug único si ya existe
  IF EXISTS (SELECT 1 FROM core.organizations WHERE slug = safe_slug) THEN
    safe_slug := safe_slug || '-' || substring(create_notary_organization.user_id::text, 1, 8);
  END IF;

  -- Crear organización notaría
  INSERT INTO core.organizations (
    name,
    slug,
    org_type,
    status,
    email,
    phone,
    country,
    city,
    address,
    settings
  ) VALUES (
    org_name,
    safe_slug,
    'notary',
    'trial',
    notary_email,
    notary_phone,
    UPPER(notary_country_code),
    notary_city,
    notary_address,
    jsonb_build_object(
      'user_type', 'notary'
    )
  )
  RETURNING id INTO new_org_id;

  -- Obtener rol de owner
  SELECT id INTO owner_role_id
  FROM core.roles
  WHERE slug = 'org_owner'
  LIMIT 1;

  -- Asignar usuario como owner
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    new_org_id,
    create_notary_organization.user_id,
    owner_role_id,
    'active'
  );

  -- Crear notaría (pendiente de aprobación)
  INSERT INTO signing.notary_offices (
    organization_id,
    name,
    country_code,
    city,
    address,
    email,
    phone,
    is_active,
    accepts_new_documents,
    approval_status
  ) VALUES (
    new_org_id,
    org_name,
    UPPER(notary_country_code),
    notary_city,
    notary_address,
    notary_email,
    notary_phone,
    true,
    false,
    'pending'
  );

  -- Asignar TODAS las apps activas automáticamente
  PERFORM public.assign_default_apps_to_org(new_org_id);

  -- Actualizar last_active_organization_id del usuario
  UPDATE core.users
  SET last_active_organization_id = new_org_id
  WHERE id = create_notary_organization.user_id;

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_notary_organization(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Notary organization system actualizado';
END $$;
