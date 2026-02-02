-- =====================================================
-- Migration: Fix update_signer_status_admin enum type
-- Description: Corrige el tipo de status de TEXT a signing.signer_status
-- Created: 2026-02-02
-- =====================================================

-- Recrear la función con el cast correcto para status
CREATE OR REPLACE FUNCTION public.update_signer_status_admin(
  p_signer_id UUID,
  p_status TEXT,
  p_signed_at TIMESTAMPTZ DEFAULT NULL,
  p_signature_ip TEXT DEFAULT NULL,
  p_signature_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_signer RECORD;
  v_ip INET;
BEGIN
  -- Verificar que el firmante existe
  SELECT * INTO v_signer
  FROM signing.signers
  WHERE id = p_signer_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Signer not found'
    );
  END IF;
  
  -- Convertir IP de texto a inet (puede ser NULL o inválida)
  BEGIN
    IF p_signature_ip IS NOT NULL AND p_signature_ip != '' THEN
      v_ip := p_signature_ip::INET;
    ELSE
      v_ip := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;
  
  -- Actualizar el estado del firmante
  -- Cast explícito de TEXT a signing.signer_status
  UPDATE signing.signers
  SET 
    status = p_status::signing.signer_status,
    signed_at = COALESCE(p_signed_at, signed_at),
    signature_ip = COALESCE(v_ip, signature_ip),
    signature_user_agent = COALESCE(p_signature_user_agent, signature_user_agent),
    updated_at = NOW()
  WHERE id = p_signer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'signer_id', p_signer_id,
    'new_status', p_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mantener permisos
REVOKE ALL ON FUNCTION public.update_signer_status_admin FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_signer_status_admin FROM authenticated;
REVOKE ALL ON FUNCTION public.update_signer_status_admin FROM anon;
GRANT EXECUTE ON FUNCTION public.update_signer_status_admin TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Función update_signer_status_admin corregida';
  RAISE NOTICE '  - status ahora se convierte a signing.signer_status';
END $$;
