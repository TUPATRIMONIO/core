-- =====================================================
-- Migration: Notary assignment RPC (weighted tombola)
-- Description: Asigna documentos a notarías por país/servicio usando pesos
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: signing.assign_document_to_notary
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

  -- Calcular peso total
  SELECT COALESCE(SUM(ns.weight), 0)
  INTO v_total_weight
  FROM signing.notary_services ns
  JOIN signing.notary_offices no ON no.id = ns.notary_office_id
  WHERE ns.product_id = p_product_id
    AND ns.is_active = true
    AND no.is_active = true
    AND no.accepts_new_documents = true
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
-- Public wrapper
-- =====================================================

CREATE OR REPLACE FUNCTION public.assign_document_to_notary(
  p_document_id UUID,
  p_product_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN signing.assign_document_to_notary(p_document_id, p_product_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_document_to_notary(UUID, UUID) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ RPC creada: public.assign_document_to_notary(document_id, product_id)';
END $$;

