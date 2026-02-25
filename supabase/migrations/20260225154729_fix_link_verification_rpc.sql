-- =====================================================
-- Migration: Fix link_verification_to_signer RPC
-- Description: Wrapper en schema public para la función RPC
-- Created: 2026-02-25
-- =====================================================

-- Crear wrapper en schema public para que la llamada RPC funcione
-- La librería cliente de Supabase busca funciones RPC en schema public por defecto
CREATE OR REPLACE FUNCTION public.link_verification_to_signer(
  p_signer_id UUID,
  p_verification_session_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN signing.link_verification_to_signer(p_signer_id, p_verification_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.link_verification_to_signer TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_verification_to_signer TO service_role;

COMMENT ON FUNCTION public.link_verification_to_signer IS 
  'Wrapper público para signing.link_verification_to_signer';
