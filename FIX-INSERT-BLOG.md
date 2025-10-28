# Fix para Error al Crear Posts

## Problema
Al intentar crear un post aparece "Error al crear post" con error `{}` vacío.

**Causa**: Las RULES de INSERT en las vistas estaban intentando insertar TODOS los campos (incluyendo `id`, `created_at`, `updated_at`), lo que causa conflictos con los valores DEFAULT de PostgreSQL.

## Solución

Aplica la nueva migración que corrige las RULES:

### Opción 1: Con Supabase CLI (Recomendado)

```bash
supabase db push
```

### Opción 2: Manualmente en Supabase Dashboard

1. Ve a tu proyecto en Supabase Dashboard
2. Abre el **SQL Editor**
3. Copia y pega el contenido de: `supabase/migrations/20251028230000_fix_blog_views_insert.sql`
4. Ejecuta el script

## ¿Qué hace esta migración?

1. **Elimina las RULES incorrectas** anteriores
2. **Crea RULES nuevas** que especifican explícitamente solo los campos necesarios
3. **Permite que PostgreSQL genere** automáticamente: `id`, `created_at`, `updated_at`

### Campos en INSERT de blog_posts:
```sql
INSERT INTO marketing.blog_posts (
  title, slug, content, excerpt,
  featured_image_url, category_id, author_name,
  published, published_at,
  seo_title, seo_description,
  reading_time, view_count
)
-- NO incluye: id, created_at, updated_at (generados por DB)
```

## Verificar que funcionó

Después de aplicar la migración:

1. **Refresca la página** del dashboard
2. **Intenta crear un post** nuevamente
3. Deberías ver: ✅ "¡Post guardado exitosamente!"

## Sobre el Warning de Hydration

El otro error que ves:
```
data-tag-assistant-prod-present
data-tag-assistant-present
```

Es causado por **extensiones del navegador** (Google Tag Assistant u otras). No afecta la funcionalidad real, solo es un warning de desarrollo.

Para eliminarlo:
- Prueba en modo incógnito
- O desactiva temporalmente las extensiones de Chrome

---

**Nota**: Esta migración no afecta datos existentes, solo corrige cómo se insertan nuevos registros a través de las vistas.

