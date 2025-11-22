-- =====================================================
-- Migration: Add Credits Configuration to Subscription Plans
-- Description: Agregar configuración de créditos mensuales incluidos a los planes de suscripción
-- Created: 2025-11-21
-- =====================================================

SET search_path TO core, credits, billing, public, extensions;

-- =====================================================
-- UPDATE SUBSCRIPTION PLANS WITH CREDITS CONFIGURATION
-- =====================================================

-- Free Plan: 100 créditos/mes
UPDATE core.subscription_plans
SET limits = jsonb_set(
  limits,
  '{credits}',
  jsonb_build_object(
    'monthly_included', 100.00,
    'accumulates', true
  )
)
WHERE slug = 'free';

-- Starter Plan: 500 créditos/mes
UPDATE core.subscription_plans
SET limits = jsonb_set(
  limits,
  '{credits}',
  jsonb_build_object(
    'monthly_included', 500.00,
    'accumulates', true
  )
)
WHERE slug = 'starter';

-- Business Plan: 2,000 créditos/mes
UPDATE core.subscription_plans
SET limits = jsonb_set(
  limits,
  '{credits}',
  jsonb_build_object(
    'monthly_included', 2000.00,
    'accumulates', true
  )
)
WHERE slug = 'business';

-- Enterprise Plan: 10,000 créditos/mes
UPDATE core.subscription_plans
SET limits = jsonb_set(
  limits,
  '{credits}',
  jsonb_build_object(
    'monthly_included', 10000.00,
    'accumulates', true
  )
)
WHERE slug = 'enterprise';

-- =====================================================
-- FUNCTION: reload_monthly_credits
-- Description: Función para recargar créditos mensuales incluidos en planes
-- =====================================================

CREATE OR REPLACE FUNCTION credits.reload_monthly_credits()
RETURNS TABLE (
  organization_id UUID,
  credits_added DECIMAL,
  new_balance DECIMAL
) AS $$
DECLARE
  org_record RECORD;
  plan_record RECORD;
  monthly_credits DECIMAL;
  transaction_id UUID;
BEGIN
  -- Iterate through all active subscriptions
  FOR org_record IN
    SELECT 
      os.organization_id,
      os.plan_id,
      os.current_period_start,
      os.current_period_end,
      os.status
    FROM core.organization_subscriptions os
    WHERE os.status IN ('active', 'trial')
    AND os.current_period_end > NOW()
  LOOP
    -- Get plan details
    SELECT * INTO plan_record
    FROM core.subscription_plans
    WHERE id = org_record.plan_id;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    
    -- Get monthly credits from plan limits
    monthly_credits := (plan_record.limits->'credits'->>'monthly_included')::DECIMAL;
    
    IF monthly_credits IS NULL OR monthly_credits <= 0 THEN
      CONTINUE;
    END IF;
    
    -- Add credits to account
    SELECT credits.add_credits(
      org_record.organization_id,
      monthly_credits,
      'subscription_monthly',
      jsonb_build_object(
        'plan_id', org_record.plan_id,
        'plan_slug', plan_record.slug,
        'period_start', org_record.current_period_start,
        'period_end', org_record.current_period_end
      ),
      'Créditos mensuales incluidos en plan ' || plan_record.name
    ) INTO transaction_id;
    
    -- Return result
    SELECT 
      ca.balance
    INTO new_balance
    FROM credits.credit_accounts ca
    WHERE ca.organization_id = org_record.organization_id;
    
    organization_id := org_record.organization_id;
    credits_added := monthly_credits;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION credits.reload_monthly_credits IS 
'Recarga créditos mensuales incluidos en planes para todas las organizaciones activas. Debe ejecutarse mensualmente mediante cron job o edge function.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  free_credits DECIMAL;
  starter_credits DECIMAL;
  business_credits DECIMAL;
  enterprise_credits DECIMAL;
BEGIN 
  SELECT (limits->'credits'->>'monthly_included')::DECIMAL INTO free_credits
  FROM core.subscription_plans WHERE slug = 'free';
  
  SELECT (limits->'credits'->>'monthly_included')::DECIMAL INTO starter_credits
  FROM core.subscription_plans WHERE slug = 'starter';
  
  SELECT (limits->'credits'->>'monthly_included')::DECIMAL INTO business_credits
  FROM core.subscription_plans WHERE slug = 'business';
  
  SELECT (limits->'credits'->>'monthly_included')::DECIMAL INTO enterprise_credits
  FROM core.subscription_plans WHERE slug = 'enterprise';
  
  RAISE NOTICE '✅ Créditos agregados a planes de suscripción';
  RAISE NOTICE '';
  RAISE NOTICE 'Créditos mensuales incluidos:';
  RAISE NOTICE '  ✅ Free: % créditos/mes', free_credits;
  RAISE NOTICE '  ✅ Starter: % créditos/mes', starter_credits;
  RAISE NOTICE '  ✅ Business: % créditos/mes', business_credits;
  RAISE NOTICE '  ✅ Enterprise: % créditos/mes', enterprise_credits;
  RAISE NOTICE '';
  RAISE NOTICE 'Función creada:';
  RAISE NOTICE '  ✅ reload_monthly_credits() - Recarga créditos mensuales (ejecutar vía cron)';
END $$;

