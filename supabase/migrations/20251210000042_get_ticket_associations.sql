-- Function to get all ticket associations
-- Returns a JSON object with contacts, companies, and orders
-- This avoids multiple RPC calls and handles schema access securely

CREATE OR REPLACE FUNCTION public.get_ticket_associations(p_ticket_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'ticket_users', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'user', jsonb_build_object(
                        'id', u.id,
                        'first_name', u.first_name,
                        'last_name', u.last_name,
                        'email', au.email,
                        'avatar_url', u.avatar_url
                    )
                )
            ), '[]'::jsonb)
            FROM crm.ticket_users tu
            JOIN core.users u ON tu.user_id = u.id
            JOIN auth.users au ON u.id = au.id
            WHERE tu.ticket_id = p_ticket_id
        ),
        'ticket_contacts', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'contact', jsonb_build_object(
                        'id', c.id,
                        'full_name', c.full_name,
                        'email', c.email
                    )
                )
            ), '[]'::jsonb)
            FROM crm.ticket_contacts tc
            JOIN crm.contacts c ON tc.contact_id = c.id
            WHERE tc.ticket_id = p_ticket_id
        ),
        'ticket_organizations', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'organization', jsonb_build_object(
                        'id', o.id,
                        'name', o.name,
                        'industry', o.industry,
                        'slug', o.slug
                    )
                )
            ), '[]'::jsonb)
            FROM crm.ticket_organizations to_link
            JOIN core.organizations o ON to_link.organization_id = o.id
            WHERE to_link.ticket_id = p_ticket_id
        ),
        'ticket_companies', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'company', jsonb_build_object(
                        'id', c.id,
                        'name', c.name,
                        'industry', c.industry
                    )
                )
            ), '[]'::jsonb)
            FROM crm.ticket_companies tc
            JOIN crm.companies c ON tc.company_id = c.id
            WHERE tc.ticket_id = p_ticket_id
        ),
        'ticket_orders', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'order', jsonb_build_object(
                        'id', o.id,
                        'order_number', o.order_number,
                        'amount', o.amount,
                        'currency', o.currency,
                        'status', o.status,
                        'created_at', o.created_at
                    )
                )
            ), '[]'::jsonb)
            FROM crm.ticket_orders tor
            JOIN public.orders o ON tor.order_id = o.id
            WHERE tor.ticket_id = p_ticket_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ticket_associations TO authenticated, service_role;
