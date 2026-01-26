-- Migration: User Deletion and Cleanup Functions
-- Description: Adds functions to safely identify and cleanup user dependencies before deletion
-- Created: 2026-01-23

-- Function to get all dependencies of a user
CREATE OR REPLACE FUNCTION core.get_user_dependencies(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, crm, signing, billing, communications, public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Verificar si el usuario que llama es platform admin
    IF NOT core.is_platform_admin() THEN
        RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
    END IF;

    result = jsonb_build_object(
        'organization_users', (SELECT count(*) FROM core.organization_users WHERE user_id = p_user_id),
        'team_members', (SELECT count(*) FROM core.team_members WHERE user_id = p_user_id),
        'team_leads', (SELECT count(*) FROM core.teams WHERE lead_user_id = p_user_id),
        'tickets_assigned', (SELECT count(*) FROM crm.tickets WHERE assigned_to = p_user_id),
        'tickets_created', (SELECT count(*) FROM crm.tickets WHERE created_by = p_user_id),
        'deals_assigned', (SELECT count(*) FROM crm.deals WHERE assigned_to = p_user_id),
        'orders_created', (SELECT count(*) FROM billing.orders WHERE created_by_user_id = p_user_id),
        'signing_documents', (SELECT count(*) FROM signing.documents WHERE created_by = p_user_id),
        'invitations_sent', (SELECT count(*) FROM core.invitations WHERE invited_by = p_user_id),
        'api_keys_created', (SELECT count(*) FROM core.api_keys WHERE created_by = p_user_id),
        'feedback_submitted', (SELECT count(*) FROM public.user_feedback WHERE user_id = p_user_id),
        'email_accounts', (SELECT count(*) FROM communications.email_accounts WHERE owner_user_id = p_user_id)
    );

    RETURN result;
END;
$$;

-- Function to safely delete a user with cleanup/reasignment
CREATE OR REPLACE FUNCTION core.delete_user_with_cleanup(
    p_user_id UUID, 
    p_reassign_to UUID DEFAULT NULL, 
    p_delete_data BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, crm, signing, billing, communications, public, auth
AS $$
BEGIN
    -- 1. Verificar permisos
    IF NOT core.is_platform_admin() THEN
        RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
    END IF;

    -- 2. No permitir borrarse a sí mismo
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes eliminar tu propio usuario';
    END IF;

    -- 3. Manejar reasignación o eliminación de datos dependientes
    
    -- CRM Tickets
    IF p_reassign_to IS NOT NULL THEN
        UPDATE crm.tickets SET assigned_to = p_reassign_to WHERE assigned_to = p_user_id;
        UPDATE crm.tickets SET created_by = p_reassign_to WHERE created_by = p_user_id;
        UPDATE crm.deals SET assigned_to = p_reassign_to WHERE assigned_to = p_user_id;
        UPDATE signing.documents SET created_by = p_reassign_to WHERE created_by = p_user_id;
        UPDATE signing.documents SET manager_id = p_reassign_to WHERE manager_id = p_user_id;
    ELSIF p_delete_data THEN
        -- Nota: Muchas tablas tienen ON DELETE CASCADE, pero las que no, las manejamos aquí
        UPDATE crm.tickets SET assigned_to = NULL WHERE assigned_to = p_user_id;
        UPDATE crm.tickets SET created_by = NULL WHERE created_by = p_user_id;
        UPDATE crm.deals SET assigned_to = NULL WHERE assigned_to = p_user_id;
        UPDATE billing.orders SET created_by_user_id = NULL WHERE created_by_user_id = p_user_id;
    ELSE
        -- Si no hay reasignación ni borrado explícito, y hay dependencias, fallará por FK
        NULL;
    END IF;

    -- Core Teams (Liderazgo)
    IF p_reassign_to IS NOT NULL THEN
        UPDATE core.teams SET lead_user_id = p_reassign_to WHERE lead_user_id = p_user_id;
    ELSE
        UPDATE core.teams SET lead_user_id = NULL WHERE lead_user_id = p_user_id;
    END IF;

    -- API Keys y otros registros técnicos (generalmente se borran o invalidan)
    UPDATE core.api_keys SET is_active = FALSE, revoked_at = NOW(), revoked_by = auth.uid() WHERE created_by = p_user_id;

    -- 4. Eliminar de core.users (Esto disparará el borrado en cascada si está configurado)
    DELETE FROM core.users WHERE id = p_user_id;

    -- 5. Eliminar de auth.users (Usando la API de admin de Supabase es mejor, pero aquí lo hacemos vía SQL)
    -- Nota: El trigger on_auth_user_deleted suele manejar la limpieza inversa, 
    -- pero aquí borramos core.users primero que tiene ON DELETE CASCADE desde auth.users en el schema original.
    -- Si core.users tiene REFERENCES auth.users(id) ON DELETE CASCADE, borrar en auth.users es suficiente.
    
    DELETE FROM auth.users WHERE id = p_user_id;

    -- 6. Registrar evento
    INSERT INTO core.system_events (
        event_type,
        event_level,
        message,
        user_id,
        metadata
    ) VALUES (
        'user_deleted',
        'warning',
        'Usuario eliminado permanentemente: ' || p_user_id::text,
        auth.uid(),
        jsonb_build_object('deleted_user_id', p_user_id, 'reassigned_to', p_reassign_to, 'data_deleted', p_delete_data)
    );

    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION core.get_user_dependencies(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION core.delete_user_with_cleanup(UUID, UUID, BOOLEAN) TO authenticated;
