# Pasos Finales para Activar el Sistema

## ⚠️ IMPORTANTE: Aplicar Migraciones en Supabase

El sistema está construido pero **necesitas aplicar las migraciones en tu base de datos de Supabase** para que funcione.

## 📋 Checklist de Activación

### ✅ **Paso 1: Aplicar Migración Principal**

1. Ve a tu **Supabase Dashboard**
2. Abre el **SQL Editor**
3. Copia TODO el contenido del archivo:
   `supabase/migrations/20251028150000_page_management_sistema.sql`
4. Pégalo y haz click en **Run**

Esto creará:
- ✅ Tabla `marketing.page_management`
- ✅ Tabla `marketing.user_roles`
- ✅ Funciones `get_page_status`, `can_access_page`, `get_public_pages`
- ✅ Políticas RLS de seguridad
- ✅ Datos iniciales (páginas pre-configuradas)

### ✅ **Paso 2: Aplicar Función de Acceso Admin**

En el mismo **SQL Editor de Supabase**:

1. Copia el contenido de:
   `supabase/migrations/20251028193015_funcion-para-acceso-admin.sql`
2. Pégalo y haz click en **Run**

Esto creará:
- ✅ Función `can_access_admin(user_id)` 
- ✅ Permisos GRANT necesarios

### ✅ **Paso 3: Asignarte como Administrador**

```sql
-- En Supabase SQL Editor:

-- 1. Ver tu user_id
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Asignarte rol de admin (reemplaza 'TU-USER-ID-AQUI')
INSERT INTO marketing.user_roles (user_id, role) 
VALUES ('TU-USER-ID-AQUI', 'admin');

-- 3. Verificar que se creó correctamente
SELECT * FROM marketing.user_roles;
```

### ✅ **Paso 4: Verificar que las Funciones Existen**

```sql
-- Verificar función can_access_admin
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'can_access_admin';

-- Debería retornar 1 fila

-- Verificar función get_public_pages  
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'get_public_pages';

-- Debería retornar 1 fila

-- Probar la función con tu user_id
SELECT can_access_admin('TU-USER-ID-AQUI'::uuid);

-- Debería retornar TRUE
```

### ✅ **Paso 5: Probar el Sistema**

1. **Logout** de cualquier sesión actual
2. Ve a: `http://localhost:3000` (o `app.tupatrimonio.app`)
3. **Login** con tu email/contraseña
4. Deberías ver el dashboard con opciones de:
   - ✅ Inicio
   - ✅ Blog
   - ✅ Páginas  
   - ✅ Usuarios

5. Click en **"Páginas"**
6. Deberías ver todas las páginas configuradas (aprox. 18 páginas)

## 🔍 Troubleshooting

### "No veo ninguna página en /dashboard/pages"

**Causa**: Las migraciones no están aplicadas

**Solución**:
```sql
-- Verificar si existen las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'marketing' 
  AND table_name IN ('page_management', 'user_roles');

-- Si no retorna nada, aplica las migraciones del Paso 1 y 2
```

### "Error verificando permisos" en login

**Causa**: La función `can_access_admin` no existe

**Solución**:
- Aplica la migración del **Paso 2**
- Verifica con la query del **Paso 4**

### "Solo veo Inicio en el sidebar"

**Causa**: Tu usuario no tiene rol de admin asignado

**Solución**:
- Ejecuta el INSERT del **Paso 3**
- Logout y vuelve a hacer login

### Las páginas aparecen como "No se encontraron páginas"

**Causa**: Los datos iniciales no se insertaron

**Solución**:
```sql
-- Verificar cuántas páginas hay
SELECT COUNT(*) FROM marketing.page_management;

-- Si es 0, la migración no se aplicó correctamente
-- Vuelve a ejecutar la migración del Paso 1
```

## ✅ Resultado Esperado

Cuando TODO esté configurado correctamente:

1. **Login funciona** sin errores
2. **Sidebar muestra** 4 opciones (Inicio, Blog, Páginas, Usuarios)
3. **Dashboard/pages muestra** ~18 páginas configuradas
4. **Puedes cambiar estados** de las páginas con los dropdowns
5. **Stats muestra** números correctos

---

**Si sigues estos pasos, el sistema funcionará perfectamente** 🚀

¿En cuál paso estás? ¿Ya aplicaste las migraciones?

