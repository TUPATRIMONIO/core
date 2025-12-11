-- =====================================================
-- Migration: Fix and Unify Entity Associations (Idempotent)
-- Description: Correction for generic associations + Adding User associations
-- Created: 2025-12-11
-- =====================================================

SET search_path TO crm, core, public, billing, extensions;

-- =====================================================
-- 1. Contact <-> Order (Fix references)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.contact_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contact_order UNIQUE (contact_id, order_id)
);

-- Ensure FK points to billing.orders (Fix if previously pointed elsewhere)
DO $$ BEGIN
    ALTER TABLE crm.contact_orders DROP CONSTRAINT IF EXISTS contact_orders_order_id_fkey;
    ALTER TABLE crm.contact_orders ADD CONSTRAINT contact_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES billing.orders(id) ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Skipping constraint update: %', SQLERRM;
END $$;

-- Platform Users linked to Order
CREATE TABLE IF NOT EXISTS crm.user_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_order UNIQUE (user_id, order_id)
);

ALTER TABLE crm.contact_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.user_orders ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DROP POLICY IF EXISTS "Service role full access on contact_orders" ON crm.contact_orders;
CREATE POLICY "Service role full access on contact_orders" ON crm.contact_orders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on user_orders" ON crm.user_orders;
CREATE POLICY "Service role full access on user_orders" ON crm.user_orders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_contact_orders_contact ON crm.contact_orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_orders_order ON crm.contact_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_user ON crm.user_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_order ON crm.user_orders(order_id);

-- =====================================================
-- 2. Contact <-> Organization
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.contact_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contact_organization UNIQUE (contact_id, organization_id)
);

CREATE TABLE IF NOT EXISTS crm.user_organization_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_org_link UNIQUE (user_id, organization_id)
);

ALTER TABLE crm.contact_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.user_organization_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on contact_organizations" ON crm.contact_organizations;
CREATE POLICY "Service role full access on contact_organizations" ON crm.contact_organizations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on user_organization_links" ON crm.user_organization_links;
CREATE POLICY "Service role full access on user_organization_links" ON crm.user_organization_links FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_contact_organizations_contact ON crm.contact_organizations(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_organizations_org ON crm.contact_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_org_links_user ON crm.user_organization_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_links_org ON crm.user_organization_links(organization_id);

-- =====================================================
-- 3. Order <-> Organization
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.order_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_order_organization UNIQUE (order_id, organization_id)
);

-- Fix FK if needed
DO $$ BEGIN
    ALTER TABLE crm.order_organizations DROP CONSTRAINT IF EXISTS order_organizations_order_id_fkey;
    ALTER TABLE crm.order_organizations ADD CONSTRAINT order_organizations_order_id_fkey FOREIGN KEY (order_id) REFERENCES billing.orders(id) ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Skipping constraint update: %', SQLERRM;
END $$;

ALTER TABLE crm.order_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on order_organizations" ON crm.order_organizations;
CREATE POLICY "Service role full access on order_organizations" ON crm.order_organizations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_order_organizations_order ON crm.order_organizations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_organizations_org ON crm.order_organizations(organization_id);

-- =====================================================
-- 4. RPC Functions (Replace always safe)
-- =====================================================

-- Contact/User <-> Order
CREATE OR REPLACE FUNCTION public.link_contact_order(p_contact_id UUID, p_order_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.contact_orders (contact_id, order_id) VALUES (p_contact_id, p_order_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_contact_order(p_contact_id UUID, p_order_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.contact_orders WHERE contact_id = p_contact_id AND order_id = p_order_id; END; $$;

CREATE OR REPLACE FUNCTION public.link_user_order(p_user_id UUID, p_order_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.user_orders (user_id, order_id) VALUES (p_user_id, p_order_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_user_order(p_user_id UUID, p_order_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.user_orders WHERE user_id = p_user_id AND order_id = p_order_id; END; $$;

-- Contact/User <-> Organization
CREATE OR REPLACE FUNCTION public.link_contact_organization(p_contact_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.contact_organizations (contact_id, organization_id) VALUES (p_contact_id, p_organization_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_contact_organization(p_contact_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.contact_organizations WHERE contact_id = p_contact_id AND organization_id = p_organization_id; END; $$;

CREATE OR REPLACE FUNCTION public.link_user_organization_link(p_user_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.user_organization_links (user_id, organization_id) VALUES (p_user_id, p_organization_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_user_organization_link(p_user_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.user_organization_links WHERE user_id = p_user_id AND organization_id = p_organization_id; END; $$;

-- Order <-> Organization
CREATE OR REPLACE FUNCTION public.link_order_organization(p_order_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.order_organizations (order_id, organization_id) VALUES (p_order_id, p_organization_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_order_organization(p_order_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.order_organizations WHERE order_id = p_order_id AND organization_id = p_organization_id; END; $$;

-- Get Associations (Replace)
CREATE OR REPLACE FUNCTION public.get_order_associations(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'contacts', COALESCE((
            SELECT jsonb_agg(item) FROM (
                SELECT c.id, COALESCE(c.full_name, c.email) as name, c.email as subtext, NULL::text as avatar, 'crm' as source
                FROM crm.contact_orders co JOIN crm.contacts c ON c.id = co.contact_id WHERE co.order_id = p_order_id
                UNION ALL
                SELECT u.id, COALESCE(u.first_name || ' ' || u.last_name, au.email) as name, au.email as subtext, u.avatar_url as avatar, 'platform' as source
                FROM crm.user_orders uo JOIN core.users u ON u.id = uo.user_id JOIN auth.users au ON au.id = u.id WHERE uo.order_id = p_order_id
            ) item
        ), '[]'::jsonb),
        'tickets', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.ticket_number || ' ' || t.subject, 'subtext', t.status))
            FROM crm.ticket_orders tord JOIN crm.tickets t ON t.id = tord.ticket_id WHERE tord.order_id = p_order_id
        ), '[]'::jsonb),
        'organizations', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'subtext', COALESCE(o.industry, 'Organización')))
            FROM crm.order_organizations oo JOIN core.organizations o ON o.id = oo.organization_id WHERE oo.order_id = p_order_id
        ), '[]'::jsonb)
    ) INTO result;
    RETURN result;
END;
$$;

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
        'orders', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', 'Pedido #' || o.order_number, 'subtext', o.currency || ' ' || o.amount::TEXT || ' - ' || o.status))
            FROM crm.order_organizations oo JOIN billing.orders o ON o.id = oo.order_id WHERE oo.organization_id = p_organization_id
        ), '[]'::jsonb)
    ) INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_associations(p_contact_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'orders', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', 'Pedido #' || o.order_number, 'subtext', o.currency || ' ' || o.amount::TEXT || ' - ' || o.status))
            FROM crm.contact_orders co JOIN billing.orders o ON o.id = co.order_id WHERE co.contact_id = p_contact_id
        ), '[]'::jsonb),
        'organizations', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', org.id, 'name', org.name, 'subtext', COALESCE(org.industry, 'Organización')))
            FROM crm.contact_organizations corg JOIN core.organizations org ON org.id = corg.organization_id WHERE corg.contact_id = p_contact_id
        ), '[]'::jsonb),
        'tickets', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.ticket_number || ' ' || t.subject, 'subtext', t.status))
            FROM crm.ticket_contacts tc JOIN crm.tickets t ON t.id = tc.ticket_id WHERE tc.contact_id = p_contact_id
        ), '[]'::jsonb)
    ) INTO result;
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_contact_order TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_contact_order TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_user_order TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_user_order TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_contact_organization TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_contact_organization TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_user_organization_link TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_user_organization_link TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_order_organization TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_order_organization TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_order_associations TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_associations TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_contact_associations TO authenticated, service_role;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tablas de asociación y RPCs actualizados exitosamente (Idempotente)';
END $$;
