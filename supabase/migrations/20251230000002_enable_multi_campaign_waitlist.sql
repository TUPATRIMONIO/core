-- Migration: Enable multi-campaign waitlist
-- Description: Permite suscripciones múltiples para el mismo email si son campañas distintas
-- Created: 2025-12-30

-- 1. Modificar tabla waitlist_subscribers
ALTER TABLE marketing.waitlist_subscribers
  DROP CONSTRAINT IF EXISTS waitlist_subscribers_email_key; -- Nombre estándar de la constraint unique

ALTER TABLE marketing.waitlist_subscribers
  ADD COLUMN IF NOT EXISTS campaign TEXT NOT NULL DEFAULT 'beta';

-- Crear índice único compuesto (email + campaign)
-- Usamos un nombre explícito para la constraint
ALTER TABLE marketing.waitlist_subscribers
  ADD CONSTRAINT waitlist_subscribers_email_campaign_key UNIQUE (email, campaign);


-- 2. Actualizar función RPC para soportar campaign
CREATE OR REPLACE FUNCTION public.subscribe_to_waitlist(
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_campaign TEXT DEFAULT 'beta' -- Nuevo parámetro
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
  p_campaign := lower(trim(p_campaign));
  
  -- Insertar en la tabla marketing con campaign
  INSERT INTO marketing.waitlist_subscribers (
    email, 
    first_name, 
    last_name, 
    company, 
    use_case, 
    campaign, -- Nuevo campo
    referral_source, 
    ip_address, 
    user_agent, 
    status
  ) VALUES (
    p_email, 
    trim(p_first_name), 
    trim(p_last_name), 
    trim(p_company),
    CASE 
      WHEN p_company IS NOT NULL AND length(trim(p_company)) > 0 THEN 'business' 
      ELSE 'personal' 
    END, 
    p_campaign, -- Insertar campaign
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
    'email', p_email,
    'campaign', p_campaign
  );
  
  RETURN v_result;

EXCEPTION 
  WHEN unique_violation THEN
    -- Mensaje específico indicando que ya está registrado EN ESTA CAMPAÑA
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'email_exists',
      'message', 'Este correo ya está registrado en la lista ' || p_campaign || '.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;
