-- Migration: Mejorar trigger de nuevo usuario
-- Description: Actualiza el trigger para sincronizar correctamente email y metadata de auth.users a core.users
-- Created: 2025-11-19

-- =====================================================
-- MEJORAR FUNCIÓN handle_new_user
-- =====================================================

CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  owner_role_id UUID;
BEGIN
  -- 1. Crear usuario en core.users con todos los datos
  INSERT INTO core.users (
    id,
    email,
    full_name,
    phone,
    avatar_url,
    default_currency,
    country,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'default_currency', 'CLP'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'CL'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, core.users.full_name),
    phone = COALESCE(EXCLUDED.phone, core.users.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, core.users.avatar_url),
    updated_at = NOW();

  -- 2. Crear organización personal
  INSERT INTO core.organizations (
    name,
    slug,
    org_type,
    status,
    email,
    is_personal
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'personal-' || NEW.id,
    'personal',
    'active',
    NEW.email,
    true
  )
  RETURNING id INTO new_org_id;

  -- 3. Obtener rol de owner
  SELECT id INTO owner_role_id
  FROM core.roles
  WHERE slug = 'org_owner'
  LIMIT 1;

  -- Si no existe el rol, usar NULL (no debería pasar)
  IF owner_role_id IS NULL THEN
    RAISE WARNING 'Rol org_owner no encontrado para usuario %', NEW.id;
    -- Intentar crear el rol básico si no existe
    INSERT INTO core.roles (name, slug, level, is_system, permissions)
    VALUES ('Organization Owner', 'org_owner', 10, true, '{"*": {"*": true}}'::jsonb)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO owner_role_id;
  END IF;

  -- 4. Vincular usuario a su organización
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status,
    joined_at
  ) VALUES (
    new_org_id,
    NEW.id,
    owner_role_id,
    'active',
    NOW()
  );

  -- 5. Crear balance de créditos inicial
  INSERT INTO core.organization_credits (
    organization_id,
    balance,
    allow_transfers
  ) VALUES (
    new_org_id,
    0,
    false
  );

  -- 6. Actualizar last_active_organization_id
  UPDATE core.users
  SET last_active_organization_id = new_org_id
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar el registro
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION core.handle_new_user();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION core.handle_new_user() IS 'Trigger que crea automáticamente usuario, organización personal, membresía y balance de créditos al registrarse';

-- =====================================================
-- RESUMEN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de registro mejorado';
  RAISE NOTICE '';
  RAISE NOTICE 'Mejoras aplicadas:';
  RAISE NOTICE '  ✅ Sincroniza email, full_name, phone, avatar_url desde auth.users';
  RAISE NOTICE '  ✅ Crea organización personal automáticamente';
  RAISE NOTICE '  ✅ Asigna rol org_owner';
  RAISE NOTICE '  ✅ Crea balance de créditos inicial';
  RAISE NOTICE '  ✅ Manejo de errores mejorado';
  RAISE NOTICE '';
  RAISE NOTICE 'Flujo de registro:';
  RAISE NOTICE '  1. Usuario se registra vía Supabase Auth';
  RAISE NOTICE '  2. Trigger crea registro en core.users';
  RAISE NOTICE '  3. Trigger crea organización personal';
  RAISE NOTICE '  4. Trigger vincula usuario como owner';
  RAISE NOTICE '  5. Trigger crea balance de créditos';
  RAISE NOTICE '  6. Usuario es redirigido a /dashboard';
END $$;

