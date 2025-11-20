# Aplicar Nuevas Migraciones - TuPatrimonio

## 📋 Migraciones Nuevas (19 de Noviembre 2024)

Se crearon 4 nuevas migraciones que deben aplicarse en orden:

1. **20251119010000_improve-auth-trigger.sql**
   - Mejora el trigger de registro automático
   - Sincroniza datos de auth.users a core.users
   - Crea organización personal automáticamente

2. **20251119011000_setup-storage-buckets.sql**
   - Crea buckets de Supabase Storage
   - Configura políticas RLS para storage
   - Buckets: `signatures`, `notary-documents`

3. **20251119012000_verify-rls-policies.sql**
   - Verifica RLS en todas las tablas
   - Agrega políticas faltantes
   - Función de verificación `verify_rls_status()`

4. **20251119013000_seed-initial-data.sql**
   - Datos iniciales necesarios
   - Paquetes de créditos
   - Proveedores de pago
   - Proveedores de firma
   - Tipos de servicios notariales
   - Productos y precios
   - Notaría de ejemplo

---

## 🚀 OPCIÓN 1: Aplicar con Supabase CLI (Recomendado)

```bash
# Desde la raíz del proyecto
cd supabase
supabase db push
```

Esto aplicará automáticamente todas las migraciones pendientes en orden.

---

## 🔧 OPCIÓN 2: Aplicar Manualmente

Si no tienes Supabase CLI o prefieres hacerlo manual:

### Paso 1: Conectar a la Base de Datos

```bash
# Obtén la connection string de tu proyecto Supabase
# Dashboard → Settings → Database → Connection string

psql "postgresql://postgres:[TU-PASSWORD]@[TU-HOST]:5432/postgres"
```

### Paso 2: Aplicar Migraciones en Orden

```sql
-- 1. Mejorar trigger de auth
\i migrations/20251119010000_improve-auth-trigger.sql

-- 2. Configurar storage
\i migrations/20251119011000_setup-storage-buckets.sql

-- 3. Verificar RLS
\i migrations/20251119012000_verify-rls-policies.sql

-- 4. Datos iniciales
\i migrations/20251119013000_seed-initial-data.sql
```

---

## ✅ VERIFICAR QUE TODO ESTÁ OK

Después de aplicar las migraciones, ejecuta estas queries para verificar:

### 1. Verificar Trigger de Registro
```sql
-- Debería existir el trigger
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### 2. Verificar Storage Buckets
```sql
-- Deberían existir 2 buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('signatures', 'notary-documents');
```

### 3. Verificar Políticas RLS
```sql
-- Ver estado de RLS en todas las tablas
SELECT * FROM verify_rls_status();

-- Deberían estar todas con rls_enabled = true y policies_count > 0
```

### 4. Verificar Datos Iniciales
```sql
-- Paquetes de créditos (deberían ser 4)
SELECT name, credits, bonus_credits 
FROM core.credit_packages 
WHERE is_active = true;

-- Proveedores de pago (deberían ser 2)
SELECT name, slug 
FROM core.payment_providers 
WHERE is_active = true;

-- Proveedores de firma (deberían ser 2)
SELECT name, slug 
FROM signatures.providers 
WHERE is_active = true;

-- Servicios notariales (deberían ser 4)
SELECT name, base_price 
FROM notary.service_types 
WHERE is_active = true;

-- Monedas (deberían ser 6)
SELECT code, name, symbol 
FROM core.currencies 
WHERE is_active = true;
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Si la migración falla con "role org_owner not found"

```sql
-- Verificar que existe el rol
SELECT * FROM core.roles WHERE slug = 'org_owner';

-- Si no existe, la migración base no se aplicó correctamente
-- Aplicar primero: 20251119004248_core-robust-multitenancy.sql
```

### Si falla con "table organization_users not found"

```sql
-- Verificar que existe la tabla
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'core' AND table_name = 'organization_users';

-- Si no existe, aplicar migración base primero
```

### Si los buckets de storage no se crean

Ir al dashboard de Supabase:
1. Storage → Create bucket
2. Nombre: `signatures`
3. Public: No
4. File size limit: 50MB
5. Allowed MIME types: `application/pdf`

Repetir para `notary-documents`.

---

## 📊 RESULTADO ESPERADO

Después de aplicar todo, deberías tener:

### Base de Datos
- ✅ Todos los schemas (core, signatures, notary, crm)
- ✅ Todas las tablas con RLS habilitado
- ✅ Trigger de registro funcionando
- ✅ Funciones de créditos operativas

### Datos Iniciales
- ✅ 4 paquetes de créditos
- ✅ Precios en 3 monedas (CLP, USD, MXN)
- ✅ 2 proveedores de pago
- ✅ 2 proveedores de firma
- ✅ 4 tipos de servicios notariales
- ✅ 6 monedas activas
- ✅ 7 productos en catálogo
- ✅ 1 notaría de ejemplo

### Storage
- ✅ Bucket `signatures` creado
- ✅ Bucket `notary-documents` creado
- ✅ Políticas RLS configuradas

### Aplicación Web
- ✅ Sistema de auth completo
- ✅ Dashboard funcional
- ✅ Compra de créditos
- ✅ Firma electrónica
- ✅ Servicios notariales
- ✅ Portal de notarías
- ✅ Gestión de organización
- ✅ Permisos granulares

---

## 🎯 PRÓXIMO PASO

```bash
# 1. Aplicar migraciones
supabase db push

# 2. Reiniciar el servidor (si está corriendo)
# Ctrl+C en la terminal
npm run dev

# 3. Ir a http://localhost:3000
# 4. Registrarte con un usuario nuevo
# 5. ¡Empezar a probar!
```

---

## 📝 NOTAS

- Las integraciones de pago están **simuladas** (redirects locales)
- Los proveedores de firma están **simulados** (estructura lista)
- Los emails están **simulados** (solo logs por ahora)
- La notaría de ejemplo es solo para **testing** (eliminar en producción)

Para activar las integraciones reales, necesitas configurar:
- Variables de entorno (STRIPE_SECRET_KEY, etc.)
- Webhooks de proveedores
- API de SendGrid o similar

---

**¿Listo?** Aplica las migraciones y empieza a probar! 🚀

