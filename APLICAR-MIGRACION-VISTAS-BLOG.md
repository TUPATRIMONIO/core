# Aplicar Migración de Vistas de Blog

## Problema Resuelto

El error era porque las tablas `blog_posts` y `blog_categories` están en el schema `marketing`, pero Supabase JS client busca por defecto en el schema `public`.

## Solución

Creé vistas en el schema `public` que redirigen a las tablas en `marketing`. Esto permite que el código JavaScript use nombres simples como `blog_posts` y `blog_categories` sin necesidad de especificar el schema.

## Aplicar la Migración

### Opción 1: Con Supabase CLI (Recomendado)

```bash
# Desde la raíz del proyecto
supabase db push
```

### Opción 2: Manualmente en Supabase Dashboard

1. Ve a tu proyecto en Supabase Dashboard
2. Abre el SQL Editor
3. Copia y pega el contenido del archivo: `supabase/migrations/20251028220000_create_blog_views.sql`
4. Ejecuta el script

### Opción 3: Con psql directo

```bash
psql -h tu-proyecto.supabase.co -U postgres -d postgres -f supabase/migrations/20251028220000_create_blog_views.sql
```

## ¿Qué hace la migración?

1. **Crea vistas en public**:
   - `public.blog_posts` → `marketing.blog_posts`
   - `public.blog_categories` → `marketing.blog_categories`

2. **Configura permisos RLS**:
   - Las vistas heredan automáticamente las políticas RLS de las tablas base
   - Usuarios autenticados pueden leer/escribir
   - Usuarios anónimos solo pueden leer posts publicados

3. **Crea RULES para modificación**:
   - Permite INSERT, UPDATE, DELETE a través de las vistas
   - Las operaciones se redirigen automáticamente a las tablas reales en `marketing`

## Verificar que funcionó

Después de aplicar la migración, refresca la página del dashboard y deberías ver:
- ✅ Categorías cargadas sin errores
- ✅ Posts cargados sin errores
- ✅ Posibilidad de crear/editar/eliminar categorías y posts

## Notas Importantes

- ✅ No se pierde ningún dato
- ✅ Las tablas originales en `marketing` se mantienen intactas
- ✅ Las vistas son solo un "alias" para acceder a las tablas
- ✅ Todas las políticas RLS existentes siguen funcionando

## Si tienes problemas

Si después de aplicar la migración sigues viendo errores, ejecuta este comando en el SQL Editor para verificar que las vistas existen:

```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('blog_posts', 'blog_categories');
```

Deberías ver 2 filas con `table_type = 'VIEW'`.

