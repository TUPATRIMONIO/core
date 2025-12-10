-- RPC functions for accessing entities across schemas
-- This bypasses PostgREST schema limitations

-- Function to fetch users (platform) or contacts (client)
CREATE OR REPLACE FUNCTION public.fetch_association_contacts(
    p_is_platform BOOLEAN,
    p_offset INT DEFAULT 0,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    avatar TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    IF p_is_platform THEN
        -- Count total platform users
        SELECT COUNT(*) INTO v_total FROM core.users;
        
        RETURN QUERY
        SELECT 
            u.id,
            COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email) AS top_text,
            u.email AS sub_text,
            u.avatar_url AS avatar,
            v_total AS total_count
        FROM core.users u
        ORDER BY u.first_name ASC NULLS LAST
        OFFSET p_offset
        LIMIT p_limit;
    ELSE
        -- Count total CRM contacts
        SELECT COUNT(*) INTO v_total FROM crm.contacts;
        
        RETURN QUERY
        SELECT 
            c.id,
            c.full_name AS top_text,
            c.email AS sub_text,
            NULL::TEXT AS avatar,
            v_total AS total_count
        FROM crm.contacts c
        ORDER BY c.full_name ASC NULLS LAST
        OFFSET p_offset
        LIMIT p_limit;
    END IF;
END;
$$;

-- Function to fetch organizations (platform) or companies (client)
CREATE OR REPLACE FUNCTION public.fetch_association_companies(
    p_is_platform BOOLEAN,
    p_offset INT DEFAULT 0,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    IF p_is_platform THEN
        SELECT COUNT(*) INTO v_total FROM core.organizations;
        
        RETURN QUERY
        SELECT 
            o.id,
            o.name AS top_text,
            COALESCE(o.industry, 'Organización') AS sub_text,
            v_total AS total_count
        FROM core.organizations o
        ORDER BY o.name ASC
        OFFSET p_offset
        LIMIT p_limit;
    ELSE
        SELECT COUNT(*) INTO v_total FROM crm.companies;
        
        RETURN QUERY
        SELECT 
            c.id,
            c.name AS top_text,
            COALESCE(c.industry, 'Empresa') AS sub_text,
            v_total AS total_count
        FROM crm.companies c
        ORDER BY c.name ASC
        OFFSET p_offset
        LIMIT p_limit;
    END IF;
END;
$$;

-- Function to fetch orders
CREATE OR REPLACE FUNCTION public.fetch_association_orders(
    p_offset INT DEFAULT 0,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.orders;
    
    RETURN QUERY
    SELECT 
        o.id,
        'Pedido #' || o.order_number AS top_text,
        o.currency || ' ' || o.amount::TEXT || ' - ' || o.status AS sub_text,
        v_total AS total_count
    FROM public.orders o
    ORDER BY o.created_at DESC
    OFFSET p_offset
    LIMIT p_limit;
END;
$$;

-- Search functions
CREATE OR REPLACE FUNCTION public.search_association_contacts(
    p_is_platform BOOLEAN,
    p_query TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_is_platform THEN
        RETURN QUERY
        SELECT 
            u.id,
            COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email) AS top_text,
            u.email AS sub_text,
            u.avatar_url AS avatar
        FROM core.users u
        WHERE 
            u.first_name ILIKE '%' || p_query || '%' OR
            u.last_name ILIKE '%' || p_query || '%' OR
            u.email ILIKE '%' || p_query || '%'
        LIMIT p_limit;
    ELSE
        RETURN QUERY
        SELECT 
            c.id,
            c.full_name AS top_text,
            c.email AS sub_text,
            NULL::TEXT AS avatar
        FROM crm.contacts c
        WHERE 
            c.full_name ILIKE '%' || p_query || '%' OR
            c.email ILIKE '%' || p_query || '%'
        LIMIT p_limit;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_association_companies(
    p_is_platform BOOLEAN,
    p_query TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_is_platform THEN
        RETURN QUERY
        SELECT 
            o.id,
            o.name AS top_text,
            COALESCE(o.industry, 'Organización') AS sub_text
        FROM core.organizations o
        WHERE o.name ILIKE '%' || p_query || '%'
        LIMIT p_limit;
    ELSE
        RETURN QUERY
        SELECT 
            c.id,
            c.name AS top_text,
            COALESCE(c.industry, 'Empresa') AS sub_text
        FROM crm.companies c
        WHERE c.name ILIKE '%' || p_query || '%'
        LIMIT p_limit;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_association_orders(
    p_query TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        'Pedido #' || o.order_number AS top_text,
        o.currency || ' ' || o.amount::TEXT || ' - ' || o.status AS sub_text
    FROM public.orders o
    WHERE o.order_number ILIKE '%' || p_query || '%'
    LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fetch_association_contacts TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_association_companies TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_association_orders TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_association_contacts TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_association_companies TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_association_orders TO authenticated, service_role;
