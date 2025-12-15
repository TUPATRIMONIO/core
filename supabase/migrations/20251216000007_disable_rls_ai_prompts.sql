-- Deshabilitar RLS en ai_prompts (tabla de configuración admin)
-- Las políticas de acceso se manejan a nivel de aplicación (solo admins acceden al panel)

ALTER TABLE public.ai_prompts DISABLE ROW LEVEL SECURITY;

-- También asegurar que la vista materializada (si existe) sea accesible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'ai_prompt_statistics') THEN
    -- Las vistas materializadas no tienen RLS, pero aseguramos grants
    GRANT SELECT ON public.ai_prompt_statistics TO authenticated;
    GRANT SELECT ON public.ai_prompt_statistics TO service_role;
  END IF;
END $$;
