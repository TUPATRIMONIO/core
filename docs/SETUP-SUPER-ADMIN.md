# Setup Super Admin - TuPatrimonio CRM

## 🎯 Guía Completa para Convertirte en Super Admin

---

## 📋 ¿Qué es un Super Admin?

El **Super Admin** (platform_super_admin) es el rol de máximo nivel que te permite:

✅ Ver TODOS los datos de TODAS las organizaciones  
✅ Gestionar el blog y contenido de marketing  
✅ Acceso total al CRM con vista global  
✅ Soporte y auditoría de clientes  
✅ Administración total del sistema  

---

## 🚀 SETUP RÁPIDO (3 Pasos)

### **Paso 1: Obtener Tu User ID**

Ve a **Supabase Dashboard → SQL Editor** y ejecuta:

```sql
SELECT id, email FROM auth.users WHERE email = 'tu@email.com';
```

**Reemplaza `tu@email.com`** con el email que usaste para registrarte.

📋 **Copia el `id`** (es un UUID como `550e8400-e29b-41d4-a716-446655440000`)

---

### **Paso 2: Ejecutar Script de Asignación**

Copia y pega este script completo en **Supabase SQL Editor**:

```sql
-- ============================================================
-- SCRIPT: Asignar Super Admin a Usuario
-- ============================================================
-- INSTRUCCIONES:
-- 1. Reemplaza 'TU-EMAIL@AQUI.com' con tu email (2 lugares)
-- 2. Ejecuta el script completo
-- ============================================================

DO $$
DECLARE
  target_user_id UUID;
  platform_org_id UUID;
  super_admin_role_id UUID;
BEGIN
  -- ========================================
  -- CONFIGURACIÓN: Cambia solo esta línea
  -- ========================================
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'TU-EMAIL@AQUI.com'; -- ← CAMBIAR AQUÍ
  -- ========================================
  
  -- Validaciones
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Verifica el email.';
  END IF;

  SELECT id INTO platform_org_id
  FROM core.organizations
  WHERE org_type = 'platform'
  LIMIT 1;
  
  IF platform_org_id IS NULL THEN
    RAISE EXCEPTION 'Organización platform no encontrada. Aplica migración schema-core.sql';
  END IF;

  SELECT id INTO super_admin_role_id
  FROM core.roles
  WHERE slug = 'platform_super_admin'
  LIMIT 1;
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Rol platform_super_admin no encontrado. Aplica migración platform-organization-setup.sql';
  END IF;

  -- Crear entrada en core.users
  INSERT INTO core.users (id, status)
  VALUES (target_user_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    status = 'active';

  -- Asignar a organización platform
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    platform_org_id,
    target_user_id,
    super_admin_role_id,
    'active'
  )
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role_id = super_admin_role_id,
    status = 'active';

  -- Actualizar última org activa
  UPDATE core.users
  SET last_active_organization_id = platform_org_id
  WHERE id = target_user_id;

  -- Mensajes de éxito
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '✅ Super Admin Configurado Exitosamente';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Usuario: %', (SELECT email FROM auth.users WHERE id = target_user_id);
  RAISE NOTICE 'Organización: TuPatrimonio Platform';
  RAISE NOTICE 'Rol: platform_super_admin (nivel 10)';
  RAISE NOTICE 'Estado: active';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Ahora puedes:';
  RAISE NOTICE '  • Ver CRM en el sidebar';
  RAISE NOTICE '  • Ver datos de TODAS las organizaciones';
  RAISE NOTICE '  • Gestionar blog y contenido';
  RAISE NOTICE '  • Administración total del sistema';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Acción requerida:';
  RAISE NOTICE '  1. Logout de la aplicación';
  RAISE NOTICE '  2. Login nuevamente';
  RAISE NOTICE '  3. ¡Disfruta tu acceso de super admin!';
  RAISE NOTICE '';
END $$;
```

**🔴 IMPORTANTE**: Reemplaza `'TU-EMAIL@AQUI.com'` en las 2 líneas marcadas con ← 

---

### **Paso 3: Verificar que Funcionó**

Ejecuta en Supabase:

```sql
-- Ver tu asignación
SELECT 
  u.email,
  o.name as organization,
  o.org_type,
  r.slug as role,
  r.level,
  r.permissions,
  ou.status
FROM core.organization_users ou
JOIN auth.users u ON u.id = ou.user_id
JOIN core.organizations o ON o.id = ou.organization_id
JOIN core.roles r ON r.id = ou.role_id
WHERE u.email = 'TU-EMAIL@AQUI.com'; -- ← Cambiar
```

**Deberías ver**:
```
email: tu@email.com
organization: TuPatrimonio Platform
org_type: platform
role: platform_super_admin
level: 10
permissions: {"platform": {"*": true}, "marketing": {"*": true}, ...}
status: active
```

---

### **Paso 4: Logout y Login**

1. En la app web: Click en "Salir"
2. Login nuevamente con tu email
3. ✅ Deberías ver la sección **"CRM"** en el sidebar
4. ✅ Deberías ver la sección **"Administración"** (Blog, Páginas)

---

## 🧪 TESTING: Verificar Vista Global

### Test 1: Crear Usuario de Prueba

```bash
# 1. Abrir navegador privado
# 2. Ir a http://localhost:3000/login
# 3. Registrarse con:
   Email: test@test.com
   Password: test123
# 4. Completar onboarding (Uso Personal)
# 5. Crear 2-3 contactos en su CRM
```

### Test 2: Ver Como Super Admin

```bash
# 1. En tu navegador normal (como super admin)
# 2. Ir a /dashboard/crm/contacts
# 3. Deberías ver:
   - TUS contactos (de TuPatrimonio Platform)
   - + Los 2-3 contactos de test@test.com
   - Todos en la misma lista
```

**Query para verificar**:
```sql
-- Como super admin, deberías ver contactos de ambas orgs
SELECT 
  c.full_name,
  c.email,
  o.name as organization,
  o.org_type
FROM crm.contacts c
JOIN core.organizations o ON o.id = c.organization_id
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## 🔐 Permisos del Super Admin

### Lo Que Puede Hacer

**En el CRM**:
- ✅ Ver contactos de todas las orgs
- ✅ Ver empresas de todas las orgs
- ✅ Ver deals de todas las orgs
- ✅ Ver tickets de todas las orgs
- ✅ Ver productos de todas las orgs
- ✅ Ver cotizaciones de todas las orgs
- ✅ Hacer soporte a cualquier cliente
- ✅ Auditar actividad

**En Administración**:
- ✅ Gestionar blog posts
- ✅ Gestionar categorías del blog
- ✅ Gestionar knowledge base
- ✅ Gestionar páginas
- ✅ Ver usuarios del sistema
- ✅ Gestión completa de contenido

**Limitaciones**:
- ❌ No puede modificar datos de otras orgs sin permiso explícito
  (las policies actuales son solo SELECT para super admin)

---

## 🛠️ Agregar Más Super Admins (Futuro)

Para agregar otro super admin (ej: tu equipo):

```sql
-- Reemplazar email
DO $$
DECLARE
  new_admin_id UUID;
BEGIN
  SELECT id INTO new_admin_id
  FROM auth.users
  WHERE email = 'nuevo-admin@tupatrimonio.app';
  
  IF new_admin_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  INSERT INTO core.users (id, status)
  VALUES (new_admin_id, 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    (SELECT id FROM core.organizations WHERE org_type = 'platform' LIMIT 1),
    new_admin_id,
    (SELECT id FROM core.roles WHERE slug = 'platform_super_admin' LIMIT 1),
    'active'
  )
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RAISE NOTICE '✅ Nuevo super admin agregado: nuevo-admin@tupatrimonio.app';
END $$;
```

---

## 📊 Verificar Todos los Super Admins

```sql
-- Ver lista de todos los super admins
SELECT 
  u.email,
  u.created_at as registered_at,
  ou.created_at as assigned_at
FROM core.organization_users ou
JOIN auth.users u ON u.id = ou.user_id
JOIN core.organizations o ON o.id = ou.organization_id
JOIN core.roles r ON r.id = ou.role_id
WHERE o.org_type = 'platform'
AND r.slug = 'platform_super_admin'
ORDER BY ou.created_at;
```

---

## 🎯 Resumen

### Para Ser Super Admin:

1. ✅ **Registrarte** en la app (o ya estar registrado)
2. ✅ **Ejecutar script** de asignación en Supabase
3. ✅ **Logout y login** nuevamente
4. ✅ **Listo** - Tienes acceso total

### Características de Super Admin:

- Vista global del CRM
- Puede ver datos de cualquier organización
- Acceso a administración de contenido
- Nivel 10 (máximo en el sistema)
- Pertenece a org "TuPatrimonio Platform"

---

## 🔮 Mejora Futura: UI para Gestionar Super Admins

En `/dashboard/users` podrías agregar:

```tsx
<Button onClick={makeUserSuperAdmin}>
  Convertir en Super Admin
</Button>
```

Esto llamaría a una API que ejecute la misma lógica del script.

---

**¡Listo! Sigue los 3 pasos y serás super admin con vista global.** 🎉

**Última actualización**: 13 de Noviembre 2025

