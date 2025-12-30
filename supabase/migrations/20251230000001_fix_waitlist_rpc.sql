-- Migration: Fix use_case constraint in subscribe_to_waitlist
-- Description: Corrige el valor de use_case para respetar el CHECK constraint ('personal' o 'business')
-- Created: 2025-12-30

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
SECURITY DEFINER
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
    -- Logica correina: derivar use_case basado en si hay empresa o no
    CASE 
      WHEN p_company IS NOT NULL AND length(trim(p_company)) > 0 THEN 'business' 
      ELSE 'personal' 
    END, 
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
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'email_exists',
      'message', 'Este correo ya está registrado.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;
