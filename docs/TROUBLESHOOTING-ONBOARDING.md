# Troubleshooting - Onboarding System

## 🔍 Diagnóstico del Error "Error al crear organización personal"

Si ves este error, significa que la API `/api/onboarding/personal` está fallando. Vamos a diagnosticar paso a paso.

---

## ✅ PASO 1: Verificar que la Migración se Aplicó

En **Supabase SQL Editor**, ejecuta:

```sql
-- Verificar funciones creadas
SELECT 
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'create_personal_organization',
  'create_business_organization',
  'user_has_organization',
  'is_platform_super_admin'
)
ORDER BY routine_name;
```

**Deberías ver 4 funciones**. Si no las ves, la migración no se aplicó correctamente.

**Solución**: Aplicar `supabase/migrations/20251113002149_creacion-org.sql`

---

## ✅ PASO 2: Verificar Rol org_owner Existe

```sql
-- Verificar rol
SELECT id, slug, level, permissions
FROM core.roles
WHERE slug = 'org_owner';
```

**Debe existir** el rol. Si no existe:

```sql
-- Crear rol manualmente
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Organization Owner',
  'org_owner',
  'Dueño de la organización',
  8,
  true,
  '{"*": true, "crm": {"*": true}}'::jsonb
);
```

---

## ✅ PASO 3: Verificar Aplicación CRM Existe

```sql
-- Verificar aplicación CRM
SELECT id, slug, name
FROM core.applications
WHERE slug = 'crm_sales';
```

**Debe existir**. Si no existe, ejecuta:

```sql
-- Crear aplicación CRM manualmente
INSERT INTO core.applications (
  name,
  slug,
  description,
  category,
  version,
  is_active,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'CRM & Sales',
  'crm_sales',
  'Sistema CRM completo',
  'business',
  '1.0.0',
  true,
  false,
  '{}'::jsonb,
  '{"max_contacts": 100, "max_users": 1}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
```

---

## ✅ PASO 4: Probar la Función Manualmente

```sql
-- Ejecutar función directamente
SELECT create_personal_organization(
  (SELECT id FROM auth.users WHERE email = 'test@test.com'),
  'test@test.com',
  'Test User'
);
```

Si esto falla, verás el error exacto en Supabase.

**Errores comunes**:

### Error: "relation core.users does not exist"

**Causa**: Schema core no existe o tabla users no está creada

**Solución**: Aplicar migración `schema-core.sql`

### Error: "User already has a personal organization"

**Causa**: Ya ejecutaste la función antes para ese usuario

**Solución**: Eliminar la org anterior:

```sql
-- Ver org del usuario
SELECT o.* FROM core.organizations o
JOIN core.organization_users ou ON ou.organization_id = o.id
WHERE ou.user_id = (SELECT id FROM auth.users WHERE email = 'test@test.com');

-- Eliminar (CASCADE eliminará organization_users automáticamente)
DELETE FROM core.organizations 
WHERE id = 'org-id-aqui';
```

---

## ✅ PASO 5: Verificar Permisos de Ejecución

```sql
-- Verificar que authenticated puede ejecutar la función
SELECT 
  r.routine_name,
  p.grantee,
  p.privilege_type
FROM information_schema.routine_privileges p
JOIN information_schema.routines r ON r.specific_name = p.specific_name
WHERE r.routine_name = 'create_personal_organization'
AND r.routine_schema = 'public';
```

**Debe mostrar**: `grantee: authenticated, privilege_type: EXECUTE`

Si no aparece:

```sql
GRANT EXECUTE ON FUNCTION public.create_personal_organization(UUID, TEXT, TEXT) TO authenticated;
```

---

## 🐛 DEBUGGING AVANZADO

### Ver Logs del Servidor

En la terminal donde corre `npm run dev`, deberías ver algo como:

```
POST /api/onboarding/personal 500
Error creating personal organization: { ... }
Error details: { code: ..., message: ..., hint: ..., details: ... }
```

Comparte ese mensaje completo.

### Ver Error en el Navegador

1. Abre DevTools (F12)
2. Tab **Network**
3. Intenta crear org personal
4. Click en la request `/api/onboarding/personal`
5. Tab **Response**
6. Verás el JSON con el error detallado

Comparte ese JSON.

---

## 🔧 SOLUCIÓN TEMPORAL: Crear Org Manualmente

Si nada funciona, puedes crear la org manualmente:

```sql
-- REEMPLAZA los valores
DO $$
DECLARE
  my_user_id UUID;
  new_org_id UUID;
  owner_role_id UUID;
BEGIN
  -- Tu user_id
  SELECT id INTO my_user_id
  FROM auth.users
  WHERE email = 'TU-EMAIL@AQUI.com'; -- ← CAMBIAR
  
  -- Crear core.users
  INSERT INTO core.users (id, status)
  VALUES (my_user_id, 'active')
  ON CONFLICT (id) DO NOTHING;
  
  -- Crear org personal
  INSERT INTO core.organizations (name, slug, org_type, status, settings)
  VALUES (
    'TU-EMAIL@AQUI.com', -- ← CAMBIAR
    'personal-' || my_user_id,
    'personal',
    'active',
    '{"is_personal_org": true}'::jsonb
  )
  RETURNING id INTO new_org_id;
  
  -- Obtener rol
  SELECT id INTO owner_role_id
  FROM core.roles
  WHERE slug = 'org_owner'
  LIMIT 1;
  
  -- Asignar
  INSERT INTO core.organization_users (organization_id, user_id, role_id, status)
  VALUES (new_org_id, my_user_id, owner_role_id, 'active');
  
  -- Habilitar CRM
  INSERT INTO core.organization_applications (organization_id, application_id, is_enabled)
  SELECT new_org_id, id, true
  FROM core.applications
  WHERE slug = 'crm_sales';
  
  -- Settings CRM
  INSERT INTO crm.settings (organization_id)
  VALUES (new_org_id);
  
  RAISE NOTICE '✅ Organización personal creada manualmente';
END $$;
```

---

## 📊 CHECKLIST COMPLETO

Ejecuta cada query y marca lo que funciona:

```sql
-- [ ] 1. Función create_personal_organization existe
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'create_personal_organization';

-- [ ] 2. Rol org_owner existe
SELECT slug FROM core.roles WHERE slug = 'org_owner';

-- [ ] 3. Aplicación crm_sales existe
SELECT slug FROM core.applications WHERE slug = 'crm_sales';

-- [ ] 4. Schema crm existe
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'crm';

-- [ ] 5. Tabla crm.settings existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'crm' AND table_name = 'settings';

-- [ ] 6. Usuario está en auth.users
SELECT email FROM auth.users WHERE email = 'TU-EMAIL'; -- ← CAMBIAR

-- [ ] 7. Usuario NO tiene org ya
SELECT COUNT(*) FROM core.organization_users 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'TU-EMAIL'); -- ← CAMBIAR
-- Debe retornar 0
```

Si alguno falla, **ese es el problema**.

---

## 💡 SOLUCIÓN MÁS PROBABLE

El error más común es que **no tienes entrada en `core.users`**. Prueba esto:

```sql
-- Ver si existes en core.users
SELECT * FROM core.users 
WHERE id = (SELECT id FROM auth.users WHERE email = 'TU-EMAIL@AQUI.com'); -- ← CAMBIAR

-- Si retorna vacío, créate manualmente:
INSERT INTO core.users (id, status)
SELECT id, 'active'
FROM auth.users
WHERE email = 'TU-EMAIL@AQUI.com' -- ← CAMBIAR
ON CONFLICT (id) DO NOTHING;
```

Luego intenta el onboarding nuevamente.

---

## 🔄 Reiniciar Completamente

Si nada funciona:

```sql
-- RESET: Eliminar tu org si existe
DELETE FROM core.organizations 
WHERE id IN (
  SELECT organization_id 
  FROM core.organization_users 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'TU-EMAIL')
);

-- Luego intentar onboarding de nuevo
```

---

**Ejecuta el CHECKLIST y comparte cuál query falla. Con eso identificamos el problema exacto.**

