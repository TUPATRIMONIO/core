-- =====================================================
-- Migration: Add update_signer_status_admin function
-- Description: Función SECURITY DEFINER para actualizar estado de firmantes
--              desde contextos sin autenticación (firmantes externos vía API)
-- Created: 2026-02-02
-- =====================================================

-- Función para actualizar estado de firmante (con bypass de RLS)
-- Solo debe ser llamada desde APIs internas con service_role
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
  
  -- Actualizar el estado del firmante
  UPDATE signing.signers
  SET 
    status = p_status,
    signed_at = COALESCE(p_signed_at, signed_at),
    signature_ip = COALESCE(p_signature_ip, signature_ip),
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

-- Solo service_role puede ejecutar esta función
REVOKE ALL ON FUNCTION public.update_signer_status_admin FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_signer_status_admin FROM authenticated;
REVOKE ALL ON FUNCTION public.update_signer_status_admin FROM anon;
GRANT EXECUTE ON FUNCTION public.update_signer_status_admin TO service_role;

COMMENT ON FUNCTION public.update_signer_status_admin IS 
  'Actualiza estado de firmante con bypass de RLS. Solo para uso interno con service_role.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Función update_signer_status_admin creada';
  RAISE NOTICE '  - SECURITY DEFINER para bypass de RLS';
  RAISE NOTICE '  - Solo accesible por service_role';
END $$;
