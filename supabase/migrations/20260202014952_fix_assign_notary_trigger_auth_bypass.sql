-- =====================================================
-- Migration: Fix assign_document_to_notary auth bypass for triggers
-- Description: Permite que la función se ejecute desde triggers
--              cuando auth.uid() es NULL (contexto service_role)
-- Created: 2026-02-02
-- =====================================================

-- PROBLEMA:
-- Cuando se firma un documento y el trigger check_all_signed actualiza el estado
-- a 'pending_notary', se dispara trigger_document_pending_notary que llama a
-- assign_document_to_notary. Esta función verifica user_belongs_to_org() pero
-- auth.uid() es NULL en contexto de trigger/service_role, causando "Access denied".

-- SOLUCIÓN:
-- Si auth.uid() es NULL, asumimos que es un contexto privilegiado (service_role
-- o trigger con SECURITY DEFINER) y bypasseamos la verificación de organización.
-- La seguridad se mantiene porque:
-- 1. La función tiene SECURITY DEFINER
-- 2. Solo puede ser llamada por roles con permisos (authenticated/service_role)
-- 3. El trigger que la llama también tiene SECURITY DEFINER

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

  -- Verificar permisos: bypass si auth.uid() es NULL (contexto service_role/trigger)
  -- o verificar que el usuario pertenece a la organización
  IF auth.uid() IS NOT NULL AND NOT signing.user_belongs_to_org(v_doc.organization_id) THEN
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

      -- Incrementar contador diario del servicio seleccionado
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

  -- Crear/actualizar registro de asignación en notary_assignments
  INSERT INTO signing.notary_assignments (document_id, notary_office_id, product_id, status)
  VALUES (p_document_id, v_selected_office_id, p_product_id, 'pending')
  ON CONFLICT (document_id) DO UPDATE SET
    notary_office_id = EXCLUDED.notary_office_id,
    product_id = EXCLUDED.product_id,
    status = 'pending',
    assigned_at = NOW(),
    updated_at = NOW();

  -- Actualizar estado del documento
  UPDATE signing.documents
  SET status = 'pending_notary',
      updated_at = NOW()
  WHERE id = p_document_id;

  RETURN v_selected_office_id;
END;
$$;

COMMENT ON FUNCTION signing.assign_document_to_notary IS 
  'Asigna una notaría al documento usando weighted random. Bypass auth cuando auth.uid() es NULL (trigger/service_role).';

DO $$
BEGIN
  RAISE NOTICE '✅ Función assign_document_to_notary actualizada con bypass para triggers';
END $$;
