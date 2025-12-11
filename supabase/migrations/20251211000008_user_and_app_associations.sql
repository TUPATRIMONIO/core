-- =====================================================
-- Migration: User Associations & App Management
-- Description: Add RPC for User associations and Org App toggling
-- Created: 2025-12-11
-- =====================================================

SET search_path TO crm, core, public, billing, extensions;

-- =====================================================
-- 1. Get User Associations RPC
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
            FROM crm.user_organization_links uol
            JOIN core.organizations org ON org.id = uol.organization_id
            WHERE uol.user_id = p_user_id
        ), '[]'::jsonb),
        'orders', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', o.id,
                'name', 'Pedido #' || o.order_number,
                'subtext', o.currency || ' ' || o.amount::TEXT || ' - ' || o.status
            ))
            FROM crm.user_orders uo
            JOIN billing.orders o ON o.id = uo.order_id
            WHERE uo.user_id = p_user_id
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

GRANT EXECUTE ON FUNCTION public.get_user_associations TO authenticated, service_role;

-- =====================================================
-- 2. Organization Applications Management
-- =====================================================

-- Get available applications that are NOT enabled for the org
CREATE OR REPLACE FUNCTION public.get_available_apps_for_org(p_org_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.slug
    FROM core.applications a
    WHERE NOT EXISTS (
        SELECT 1 
        FROM core.organization_applications oa 
        WHERE oa.application_id = a.id 
        AND oa.organization_id = p_org_id
        AND oa.is_enabled = true
    );
END;
$$;

-- Enable Application (Link)
CREATE OR REPLACE FUNCTION public.enable_org_application(p_org_id UUID, p_app_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO core.organization_applications (organization_id, application_id, is_enabled)
    VALUES (p_org_id, p_app_id, true)
    ON CONFLICT (organization_id, application_id)
    DO UPDATE SET is_enabled = true;
END;
$$;

-- Disable Application (Unlink)
CREATE OR REPLACE FUNCTION public.disable_org_application(p_org_id UUID, p_app_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE core.organization_applications
    SET is_enabled = false
    WHERE organization_id = p_org_id AND application_id = p_app_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_apps_for_org TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enable_org_application TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.disable_org_application TO authenticated, service_role;
