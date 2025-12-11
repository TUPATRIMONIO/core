-- =====================================================
-- Migration: Fix Order Associations to Show Real Purchases
-- Description: Update RPCs to fetch orders from billing.orders directly
--              (not from association tables) for organizations and users
-- Created: 2025-12-11
-- =====================================================

SET search_path TO crm, core, public, billing, extensions;

-- =====================================================
-- 1. Update get_organization_associations to fetch REAL orders
--    Orders where organization_id = p_organization_id in billing.orders
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_organization_associations(p_organization_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'contacts', COALESCE((
            SELECT jsonb_agg(item) FROM (
                SELECT c.id, COALESCE(c.full_name, c.email) as name, c.email as subtext, NULL::text as avatar, 'crm' as source
                FROM crm.contact_organizations co JOIN crm.contacts c ON c.id = co.contact_id WHERE co.organization_id = p_organization_id
                UNION ALL
                SELECT u.id, COALESCE(u.first_name || ' ' || u.last_name, au.email) as name, au.email as subtext, u.avatar_url as avatar, 'platform' as source
                FROM crm.user_organization_links uol JOIN core.users u ON u.id = uol.user_id JOIN auth.users au ON au.id = u.id WHERE uol.organization_id = p_organization_id
            ) item
        ), '[]'::jsonb),
        'tickets', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.ticket_number || ' ' || t.subject, 'subtext', t.status))
            FROM crm.ticket_organizations torg JOIN crm.tickets t ON t.id = torg.ticket_id WHERE torg.organization_id = p_organization_id
        ), '[]'::jsonb),
        -- CHANGED: Fetch from billing.orders directly (real purchases)
        'orders', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', o.id, 
                'name', 'Pedido #' || o.order_number, 
                'subtext', o.currency || ' ' || o.amount::TEXT || ' - ' || o.status
            ) ORDER BY o.created_at DESC)
            FROM billing.orders o WHERE o.organization_id = p_organization_id
        ), '[]'::jsonb)
    ) INTO result;
    RETURN result;
END;
$$;

-- =====================================================
-- 2. Update get_user_associations to fetch REAL orders
--    Orders from organizations to which the user belongs
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_associations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'organizations', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', org.id,
                'name', org.name,
                'subtext', COALESCE(org.industry, 'Organización')
            ))
            FROM core.organization_users ou
            JOIN core.organizations org ON org.id = ou.organization_id
            WHERE ou.user_id = p_user_id AND ou.status = 'active'
        ), '[]'::jsonb),
        -- CHANGED: Fetch from billing.orders directly through user's organizations
        'orders', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', o.id,
                'name', 'Pedido #' || o.order_number,
                'subtext', o.currency || ' ' || o.amount::TEXT || ' - ' || o.status
            ) ORDER BY o.created_at DESC)
            FROM billing.orders o
            WHERE o.organization_id IN (
                SELECT ou.organization_id 
                FROM core.organization_users ou 
                WHERE ou.user_id = p_user_id AND ou.status = 'active'
            )
        ), '[]'::jsonb),
        'tickets', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', t.id,
                'name', t.ticket_number || ' ' || t.subject,
                'subtext', t.status
            ))
            FROM crm.ticket_users tu
            JOIN crm.tickets t ON t.id = tu.ticket_id
            WHERE tu.user_id = p_user_id
        ), '[]'::jsonb)
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_associations TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_associations TO authenticated, service_role;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RPCs actualizadas para mostrar pedidos reales (no asociaciones manuales)';
END $$;
