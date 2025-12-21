-- Fix AI Editor model name
UPDATE public.ai_prompts
SET ai_model = 'claude-sonnet-4-5-20250929'
WHERE feature_type = 'editor_assistance'
  AND ai_model = 'claude-3-5-sonnet-20241022';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Modelo de AI Editor actualizado a claude-sonnet-4-5-20250929';
END $$;
