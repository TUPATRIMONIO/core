-- =============================================
-- Función RPC para actualizar aplicaciones
-- Solo platform admins pueden usarla
-- =============================================

CREATE OR REPLACE FUNCTION public.update_application(
  p_id UUID,
  p_is_active BOOLEAN DEFAULT NULL,
  p_is_beta BOOLEAN DEFAULT NULL,
  p_visibility_level TEXT DEFAULT NULL,
  p_allowed_countries TEXT[] DEFAULT NULL,
  p_required_subscription_tiers TEXT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar si el usuario es platform admin
  v_is_admin := public.is_platform_super_admin(auth.uid());
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'No tienes permisos para actualizar aplicaciones');
  END IF;
  
  -- Actualizar la aplicación
  UPDATE core.applications
  SET 
    is_active = COALESCE(p_is_active, is_active),
    is_beta = COALESCE(p_is_beta, is_beta),
    visibility_level = COALESCE(p_visibility_level, visibility_level),
    allowed_countries = COALESCE(p_allowed_countries, allowed_countries),
    required_subscription_tiers = COALESCE(p_required_subscription_tiers, required_subscription_tiers),
    updated_at = NOW()
  WHERE id = p_id;
  
  -- Obtener la aplicación actualizada
  SELECT json_build_object(
    'success', true,
    'data', row_to_json(a.*)
  ) INTO v_result
  FROM core.applications a
  WHERE a.id = p_id;
  
  IF v_result IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Aplicación no encontrada');
  END IF;
  
  RETURN v_result;
END;
$$;

-- Dar permisos a usuarios autenticados para ejecutar la función
GRANT EXECUTE ON FUNCTION public.update_application TO authenticated;

COMMENT ON FUNCTION public.update_application IS 
'Función RPC para actualizar aplicaciones. Solo platform admins pueden usarla.';





