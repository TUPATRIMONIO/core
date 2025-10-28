-- ================================
-- Sistema de Gestión de Páginas - TuPatrimonio Marketing
-- ================================

-- Crear tabla para gestión de páginas
CREATE TABLE IF NOT EXISTS marketing.page_management (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    route_path text NOT NULL UNIQUE,
    page_title text,
    status text NOT NULL DEFAULT 'public' CHECK (status IN ('public', 'draft', 'private')),
    seo_index boolean NOT NULL DEFAULT true,
    allowed_roles text[] DEFAULT '{"public"}',
    country_code text,
    section text,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Crear tabla para roles de usuarios
CREATE TABLE IF NOT EXISTS marketing.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'editor', 'admin', 'super_admin')),
    permissions jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_page_management_route ON marketing.page_management(route_path);
CREATE INDEX IF NOT EXISTS idx_page_management_status ON marketing.page_management(status);
CREATE INDEX IF NOT EXISTS idx_page_management_country ON marketing.page_management(country_code);
CREATE INDEX IF NOT EXISTS idx_page_management_section ON marketing.page_management(section);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON marketing.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON marketing.user_roles(role);

-- Función para trigger
CREATE OR REPLACE FUNCTION marketing.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers con DROP IF EXISTS para evitar errores
DROP TRIGGER IF EXISTS update_page_management_updated_at ON marketing.page_management;
CREATE TRIGGER update_page_management_updated_at
    BEFORE UPDATE ON marketing.page_management
    FOR EACH ROW
    EXECUTE FUNCTION marketing.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON marketing.user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON marketing.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION marketing.update_updated_at_column();

-- RLS
ALTER TABLE marketing.page_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.user_roles ENABLE ROW LEVEL SECURITY;

-- Eliminar policies antiguas si existen
DROP POLICY IF EXISTS "page_management_public_read" ON marketing.page_management;
DROP POLICY IF EXISTS "page_management_admin_all" ON marketing.page_management;
DROP POLICY IF EXISTS "page_management_editor_access" ON marketing.page_management;
DROP POLICY IF EXISTS "user_roles_admin_only" ON marketing.user_roles;
DROP POLICY IF EXISTS "user_roles_self_read" ON marketing.user_roles;

-- Crear policies
CREATE POLICY "page_management_public_read" ON marketing.page_management
    FOR SELECT USING (status = 'public');

CREATE POLICY "page_management_admin_all" ON marketing.page_management
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM marketing.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "page_management_editor_access" ON marketing.page_management
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM marketing.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('editor', 'admin', 'super_admin')
        )
    );

CREATE POLICY "user_roles_admin_only" ON marketing.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM marketing.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "user_roles_self_read" ON marketing.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Insertar datos iniciales
INSERT INTO marketing.page_management (route_path, page_title, status, seo_index, country_code, section, notes) VALUES
    ('/', 'Página Principal Global', 'public', true, null, 'home', 'Landing page principal'),
    ('/blog', 'Blog Principal', 'public', true, null, 'blog', 'Índice del blog'),
    ('/ayuda', 'Centro de Ayuda', 'public', true, null, 'help', 'Centro de ayuda y FAQ'),
    ('/cl', 'TuPatrimonio Chile', 'public', true, 'cl', 'home', 'Landing page Chile'),
    ('/cl/firmas-electronicas', 'Firmas Electrónicas Chile', 'public', true, 'cl', 'firmas', 'Página de firmas para Chile'),
    ('/cl/verificacion-identidad', 'Verificación Identidad Chile', 'public', true, 'cl', 'kyc', 'KYC para Chile'),
    ('/cl/notaria-digital', 'Notaría Digital Chile', 'public', true, 'cl', 'notaria', 'Notaría digital Chile'),
    ('/cl/precios', 'Precios Chile', 'public', true, 'cl', 'precios', 'Planes y precios Chile'),
    ('/cl/contacto', 'Contacto Chile', 'public', true, 'cl', 'contacto', 'Página de contacto Chile'),
    ('/mx', 'TuPatrimonio México', 'draft', false, 'mx', 'home', 'Landing México - próximamente'),
    ('/mx/precios', 'Precios México', 'draft', false, 'mx', 'precios', 'Precios México - en desarrollo'),
    ('/mx/contacto', 'Contacto México', 'draft', false, 'mx', 'contacto', 'Contacto México - próximamente'),
    ('/co', 'TuPatrimonio Colombia', 'draft', false, 'co', 'home', 'Landing Colombia - próximamente'),
    ('/co/precios', 'Precios Colombia', 'draft', false, 'co', 'precios', 'Precios Colombia - en desarrollo'),
    ('/co/contacto', 'Contacto Colombia', 'draft', false, 'co', 'contacto', 'Contacto Colombia - próximamente'),
    ('/cl/legal/terminos', 'Términos Chile', 'public', false, 'cl', 'legal', 'Términos y condiciones Chile'),
    ('/cl/legal/privacidad', 'Privacidad Chile', 'public', false, 'cl', 'legal', 'Política de privacidad Chile'),
    ('/cl/legal/cookies', 'Cookies Chile', 'public', false, 'cl', 'legal', 'Política de cookies Chile')
ON CONFLICT (route_path) DO NOTHING;

-- Funciones
CREATE OR REPLACE FUNCTION marketing.get_page_status(page_route text, user_role text DEFAULT 'public')
RETURNS TABLE (
    status text,
    seo_index boolean,
    allowed_roles text[],
    has_access boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.status,
        pm.seo_index,
        pm.allowed_roles,
        (pm.status = 'public' OR user_role = ANY(pm.allowed_roles) OR user_role IN ('admin', 'super_admin')) as has_access
    FROM marketing.page_management pm
    WHERE pm.route_path = page_route;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'public'::text, true::boolean, ARRAY['public']::text[], true::boolean;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION marketing.can_access_page(page_route text, user_id uuid DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
    page_status text;
    page_roles text[];
    user_role text DEFAULT 'public';
BEGIN
    IF user_id IS NOT NULL THEN
        SELECT role INTO user_role
        FROM marketing.user_roles 
        WHERE marketing.user_roles.user_id = can_access_page.user_id;
        
        IF user_role IS NULL THEN
            user_role := 'public';
        END IF;
    END IF;
    
    SELECT status, allowed_roles 
    INTO page_status, page_roles
    FROM marketing.page_management 
    WHERE route_path = page_route;
    
    IF page_status IS NULL THEN
        RETURN true;
    END IF;
    
    RETURN (
        page_status = 'public' OR
        user_role = ANY(page_roles) OR
        user_role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION marketing.get_public_pages()
RETURNS TABLE (
    route_path text,
    seo_index boolean,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.route_path,
        pm.seo_index,
        pm.updated_at
    FROM marketing.page_management pm
    WHERE pm.status = 'public' AND pm.seo_index = true
    ORDER BY pm.route_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos
GRANT EXECUTE ON FUNCTION marketing.get_page_status(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION marketing.can_access_page(text, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION marketing.get_public_pages() TO authenticated, anon;