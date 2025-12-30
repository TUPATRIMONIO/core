-- Migration: Create RPC function for beta signup
-- Description: Crea una punción en schema public para insertar en marketing.waitlist_subscribers
-- Created: 2025-12-30

-- Función para suscribirse al waitlist (bypass schema restrictions)
CREATE OR REPLACE FUNCTION public.subscribe_to_waitlist(
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar con permisos del creador (admin) para asegurar acceso a marketing
SET search_path = public, marketing, extensions
AS $$
DECLARE
  v_result JSONB;
  v_id UUID;
BEGIN
  -- Normalizar email
  p_email := lower(trim(p_email));
  
  -- Insertar en la tabla marketing
  INSERT INTO marketing.waitlist_subscribers (
    email, 
    first_name, 
    last_name, 
    company, 
    use_case, 
    referral_source, 
    ip_address, 
    user_agent, 
    status
  ) VALUES (
    p_email, 
    trim(p_first_name), 
    trim(p_last_name), 
    trim(p_company),
    'beta', 
    'beta-form', 
    p_ip_address, 
    p_user_agent, 
    'active'
  )
  RETURNING id INTO v_id;

  -- Retornar éxito
  v_result := jsonb_build_object(
    'success', true, 
    'id', v_id,
    'email', p_email
  );
  
  RETURN v_result;

EXCEPTION 
  WHEN unique_violation THEN
    -- Manejar error de email duplicado
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'email_exists',
      'message', 'Este correo ya está registrado.'
    );
  WHEN OTHERS THEN
    -- Otros errores
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist TO anon;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist TO service_role;

COMMENT ON FUNCTION public.subscribe_to_waitlist IS 'RPC function to safely handle beta signups inserting into marketing schema';
