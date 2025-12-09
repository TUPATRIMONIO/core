-- =====================================================
-- Migration: Fix upsert_user_email_signature function
-- Description: Corrige el conflicto con el trigger ensure_single_default_signature
-- Created: 2025-12-09
-- =====================================================

SET search_path TO communications, core, public, extensions;

-- Reemplazar función para evitar conflicto con trigger
CREATE OR REPLACE FUNCTION public.upsert_user_email_signature(
  p_user_id UUID,
  p_organization_id UUID,
  p_signature_html TEXT,
  p_signature_text TEXT,
  p_is_default BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_signature_id UUID;
  v_existing_id UUID;
BEGIN
  -- Verificar si ya existe una firma
  SELECT id INTO v_existing_id
  FROM communications.user_email_signatures
  WHERE user_id = p_user_id
    AND organization_id = p_organization_id
  LIMIT 1;

  -- Si se está marcando como default, primero desmarcar las demás
  IF p_is_default = true THEN
    UPDATE communications.user_email_signatures
    SET is_default = false
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND is_default = true
      AND (v_existing_id IS NULL OR id != v_existing_id);
  END IF;

  -- Si existe, actualizar
  IF v_existing_id IS NOT NULL THEN
    UPDATE communications.user_email_signatures
    SET
      signature_html = p_signature_html,
      signature_text = p_signature_text,
      is_default = p_is_default,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_signature_id;
  ELSE
    -- Si no existe, insertar
    INSERT INTO communications.user_email_signatures (
      user_id,
      organization_id,
      signature_html,
      signature_text,
      is_default
    ) VALUES (
      p_user_id,
      p_organization_id,
      p_signature_html,
      p_signature_text,
      p_is_default
    )
    RETURNING id INTO v_signature_id;
  END IF;
  
  RETURN v_signature_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función upsert_user_email_signature corregida exitosamente';
  RAISE NOTICE 'Ahora evita conflictos con el trigger ensure_single_default_signature';
END $$;

