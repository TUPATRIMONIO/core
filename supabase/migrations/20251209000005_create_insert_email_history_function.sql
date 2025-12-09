-- =====================================================
-- Migration: Create insert_email_history RPC function
-- Description: Función RPC para insertar en email_history desde service_role
-- Created: 2025-12-09
-- =====================================================

SET search_path TO communications, core, public, extensions;

-- Función para insertar en email_history (para evitar problema con vista)
CREATE OR REPLACE FUNCTION public.insert_email_history(
  p_organization_id UUID,
  p_to_email TEXT,
  p_subject TEXT,
  p_body_html TEXT,
  p_provider communications.email_provider,
  p_order_id UUID DEFAULT NULL,
  p_body_text TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_email_id UUID;
BEGIN
  INSERT INTO communications.email_history (
    organization_id,
    order_id,
    to_email,
    subject,
    body_html,
    body_text,
    provider,
    status
  ) VALUES (
    p_organization_id,
    p_order_id,
    p_to_email,
    p_subject,
    p_body_html,
    p_body_text,
    p_provider,
    'pending'
  )
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION public.insert_email_history(UUID, TEXT, TEXT, TEXT, communications.email_provider, UUID, TEXT) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función insert_email_history creada exitosamente';
END $$;

