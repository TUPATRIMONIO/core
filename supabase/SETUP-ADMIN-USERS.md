# Setup de Usuarios Admin - TuPatrimonio Platform

## ⚠️ Ejecutar DESPUÉS de aplicar la migración `20251024194000_platform-organization-setup.sql`

Esta guía te ayudará a crear tus usuarios admin iniciales y vincularlos a la organización platform.

---

## Paso 1: Obtener IDs Necesarios

Ejecuta estas queries en Supabase SQL Editor para obtener los IDs que necesitarás:

```sql
-- 1. Obtener ID de la organización platform
SELECT id, name, slug, org_type 
FROM core.organizations 
WHERE slug = 'tupatrimonio-platform';

-- 2. Obtener IDs de roles de plataforma
SELECT id, slug, name, description
FROM core.roles 
WHERE slug IN ('platform_super_admin', 'marketing_admin')
ORDER BY level DESC;
```

**📋 Anota estos IDs:**
```
PLATFORM_ORG_ID: ____________________________________
SUPER_ADMIN_ROLE_ID: ____________________________________
MARKETING_ADMIN_ROLE_ID: ____________________________________
```

---

## Paso 2: Crear Usuario en Supabase Auth

### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a **Authentication** → **Users**
2. Click en **"Add user"**
3. Completa:
   - Email: `tu-email@tupatrimonio.app`
   - Password: (genera una contraseña segura)
   - ✅ Auto Confirm User
4. Click **"Create user"**
5. **📋 Anota el User ID** que aparece en la lista

### Opción B: Desde SQL

```sql
-- Crear usuario directamente (solo para desarrollo)
-- En producción, usa el dashboard para manejar emails de confirmación
SELECT auth.admin_create_user(
  email := 'tu-email@tupatrimonio.app',
  password := 'TU_PASSWORD_SEGURO_AQUI',
  email_confirmed := true
);

-- Ver el ID del usuario recién creado
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'tu-email@tupatrimonio.app';
```

**📋 Anota el User ID:**
```
USER_ID: ____________________________________
```

---

## Paso 3: Vincular Usuario a Organización Platform

Ejecuta este SQL reemplazando los IDs que anotaste:

```sql
-- 1. Crear perfil de usuario en core.users
INSERT INTO core.users (id, first_name, last_name, status)
VALUES (
  'USER_ID_AQUI',  -- Reemplazar con tu User ID
  'Tu Nombre',
  'Tu Apellido',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Vincular usuario a organización platform como Super Admin
INSERT INTO core.organization_users (
  organization_id,
  user_id,
  role_id,
  status
) VALUES (
  'PLATFORM_ORG_ID_AQUI',      -- ID de org platform
  'USER_ID_AQUI',               -- Tu User ID
  'SUPER_ADMIN_ROLE_ID_AQUI',  -- ID del rol platform_super_admin
  'active'
);
```

---

## Paso 4: Verificar que Funciona

```sql
-- Ver tus roles y organizaciones
SELECT 
  u.email,
  o.name as organization,
  o.org_type,
  r.name as role,
  ou.status
FROM core.organization_users ou
JOIN core.organizations o ON o.id = ou.organization_id
JOIN core.roles r ON r.id = ou.role_id
JOIN auth.users u ON u.id = ou.user_id
WHERE ou.user_id = auth.uid();

-- Verificar función is_platform_admin()
SELECT marketing.is_platform_admin() as soy_admin;
-- Debe retornar: true
```

---

## Paso 5: Crear Usuarios Adicionales (Opcional)

Para agregar más admins (ej: editores de blog), repite los pasos 2-3 pero usando el rol `marketing_admin` en lugar de `platform_super_admin`.

**Ejemplo rápido:**

```sql
-- 1. Crear usuario en Auth (usa dashboard o función)
-- 2. Crear perfil y vincular como Marketing Admin

INSERT INTO core.users (id, first_name, last_name, status)
VALUES ('NUEVO_USER_ID', 'Editor', 'Blog', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO core.organization_users (organization_id, user_id, role_id, status)
VALUES (
  'PLATFORM_ORG_ID',
  'NUEVO_USER_ID',
  'MARKETING_ADMIN_ROLE_ID',  -- Rol marketing_admin (menos permisos)
  'active'
);
```

---

## Testing Final

### Test 1: Verificar Permisos de Lectura Pública

```sql
-- Esto debe funcionar SIN estar autenticado (rol anon)
SELECT id, title, slug, published_at 
FROM marketing.blog_posts 
WHERE published = true
LIMIT 5;
```

### Test 2: Verificar Permisos de Escritura Admin

```sql
-- Esto debe funcionar SOLO si eres platform admin
INSERT INTO marketing.blog_posts (
  title,
  slug,
  content,
  published,
  category_id,
  author_name
) VALUES (
  'Test Post - Verificación Permisos',
  'test-post-verificacion',
  'Este es un post de prueba para verificar permisos admin.',
  false,
  (SELECT id FROM marketing.blog_categories LIMIT 1),
  'Admin Test'
);

-- Si funcionó, eliminar el post de prueba
DELETE FROM marketing.blog_posts 
WHERE slug = 'test-post-verificacion';
```

### Test 3: Verificar Permisos de Storage

```sql
-- Verificar que puedes acceder a storage como admin
SELECT marketing.is_platform_admin();
-- Debe retornar true

-- Luego en tu aplicación, intenta subir una imagen al bucket marketing-images
-- Solo debe funcionar si eres platform admin
```

---

## ✅ Checklist de Verificación

- [ ] Migración aplicada exitosamente
- [ ] IDs de organización y roles obtenidos
- [ ] Usuario creado en Auth
- [ ] Perfil creado en core.users
- [ ] Usuario vinculado a org platform
- [ ] Función `is_platform_admin()` retorna `true`
- [ ] Puedo ver/editar posts del blog como admin
- [ ] Usuarios no-admin NO pueden editar posts
- [ ] Lectura pública de posts funciona

---

## 🆘 Troubleshooting

### "Función is_platform_admin() retorna false"

Verifica:
```sql
-- ¿Existe la vinculación?
SELECT * FROM core.organization_users WHERE user_id = auth.uid();

-- ¿El rol es correcto?
SELECT r.* 
FROM core.organization_users ou
JOIN core.roles r ON r.id = ou.role_id
WHERE ou.user_id = auth.uid();

-- ¿La org es tipo platform?
SELECT o.* 
FROM core.organization_users ou
JOIN core.organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid();
```

### "No puedo insertar en blog_posts"

Verifica las políticas RLS:
```sql
-- Ver políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'blog_posts';

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'marketing' AND tablename = 'blog_posts';
```

### "Storage rechaza mis uploads"

Verifica:
```sql
-- Ver políticas de storage
SELECT * FROM storage.policies WHERE bucket_id = 'marketing-images';

-- Verificar que el bucket existe
SELECT * FROM storage.buckets WHERE id = 'marketing-images';
```

---

## 📚 Recursos

- **Plan completo:** `sistema-roles-marketing-blog.plan.md`
- **Migración:** `supabase/migrations/20251024190000_platform-organization-setup.sql`
- **Documentación Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security

---

**✨ Una vez completado este setup, ya podrás gestionar el contenido del blog de forma segura!**

