-- =====================================================
-- Migration: Auto-assign notary on pending_notary status
-- Description: Assigns notary automatically when document enters pending_notary
-- Created: 2026-01-19
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: signing.assign_document_to_notary_system
-- =====================================================

CREATE OR REPLACE FUNCTION signing.assign_document_to_notary_system(
  p_document_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
  v_product_id UUID;
  v_country TEXT;
  v_selected_office UUID;
BEGIN
  PERFORM set_config('search_path', 'signing,core,public,extensions', true);

  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF v_doc.notary_service = 'none' THEN
    RETURN NULL;
  END IF;

  v_product_id := NULL;
  IF v_doc.metadata ? 'notary_product' THEN
    v_product_id := NULLIF(v_doc.metadata->'notary_product'->>'id', '')::UUID;
  END IF;

  IF v_product_id IS NULL THEN
    v_country := UPPER(COALESCE(v_doc.metadata->>'country_code', (SELECT country FROM core.organizations WHERE id = v_doc.organization_id), 'CL'));
    SELECT p.id
    INTO v_product_id
    FROM signing.products p
    WHERE p.category = 'notary_service'
      AND p.notary_service = v_doc.notary_service
      AND UPPER(p.country_code) = v_country
      AND p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT 1;
  END IF;

  IF v_product_id IS NULL THEN
    RAISE WARNING 'No notary product found for document % (service: %)', v_doc.id, v_doc.notary_service;
    RETURN NULL;
  END IF;

  v_selected_office := signing.assign_document_to_notary(v_doc.id, v_product_id);
  RETURN v_selected_office;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-assign on pending_notary
-- =====================================================

CREATE OR REPLACE FUNCTION signing.on_document_pending_notary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'pending_notary'
     AND (OLD.status IS NULL OR OLD.status != 'pending_notary') THEN
    PERFORM signing.assign_document_to_notary_system(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_document_pending_notary ON signing.documents;

CREATE TRIGGER trigger_document_pending_notary
  AFTER UPDATE OF status ON signing.documents
  FOR EACH ROW
  WHEN (NEW.status = 'pending_notary' AND (OLD.status IS NULL OR OLD.status != 'pending_notary'))
  EXECUTE FUNCTION signing.on_document_pending_notary();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de asignación automática a notaría configurado';
END $$;
