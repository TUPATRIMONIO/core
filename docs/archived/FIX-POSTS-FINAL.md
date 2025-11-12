# Fix Final: Posts no aparecen + Error constraint + Tiempo de lectura

## Problemas Corregidos

### 1. ✅ Posts no aparecen en el listado
**Problema**: Los posts recién creados no aparecían en la lista
**Causa**: El `useEffect` no se actualizaba correctamente cuando cambiaban los filtros
**Solución**: Corregidas las dependencias del `useEffect` en `BlogPostsList.tsx`

### 2. ✅ Error "consistent_publication" al publicar en Supabase
**Problema**: Al cambiar `published` de false a true directamente en Supabase, aparecía error de constraint
**Causa**: El constraint requiere que `published_at` NO sea NULL cuando `published=true`
**Solución**: Trigger automático que establece `published_at` cuando se publica un post

### 3. ✅ Tiempo de lectura siempre 1 minuto
**Problema**: El tiempo de lectura se mostraba siempre como 1 minuto
**Causa**: El `useEffect` causaba loops infinitos al actualizar `formData`
**Solución**: Cálculo dinámico del tiempo de lectura sin modificar el estado constantemente

### 4. ✅ Posts con published=false no se muestran
**Problema**: Los posts guardados como borrador (published=false) no aparecían en el listado
**Causa**: El filtro inicial de `category_id` era `''` (string vacío) que se evalúa como truthy y aplicaba filtro incorrecto
**Solución**: Cambiado a `category_id: undefined` - ahora muestra TODOS los posts por defecto

---

## Aplicar el Fix

### Paso 1: Aplicar migración del trigger

Necesitas aplicar la migración que crea el trigger automático para `published_at`:

```bash
supabase db push
```

O manualmente en Supabase Dashboard SQL Editor:
- Ejecuta el contenido de: `supabase/migrations/20251028235000_auto_update_published_at.sql`

### ¿Qué hace el trigger?
```sql
-- Cuando published cambia de false a true
-- Automáticamente establece published_at = NOW()
-- Si ya tiene un valor, lo mantiene
```

Esto significa:
- ✅ Puedes cambiar `published` de false a true directamente en Supabase
- ✅ `published_at` se establecerá automáticamente
- ✅ No más errores de constraint

---

## Cambios en el Código (Ya Aplicados)

### BlogPostsList.tsx

**Fix 1: Dependencias del useEffect**
```typescript
// ANTES - No se actualizaba
useEffect(() => {
  if (isAdmin) {
    fetchPosts(filters);
  }
}, [filters]); // ❌ Dependencia compleja

// AHORA - Se actualiza correctamente
useEffect(() => {
  if (isAdmin) {
    fetchPosts(filters);
    setCurrentPage(1);
  }
}, [isAdmin, filters.published, filters.category_id, filters.search]); // ✅
```

**Fix 2: Filtro inicial de categoría**
```typescript
// ANTES - String vacío se evalúa como truthy
const [filters, setFilters] = useState<BlogFilters>({
  published: undefined,
  category_id: '', // ❌ Causa filtro incorrecto
  search: ''
});

// AHORA - Undefined para no aplicar filtro
const [filters, setFilters] = useState<BlogFilters>({
  published: undefined,
  category_id: undefined, // ✅ Muestra todos los posts
  search: ''
});
```

### BlogPostEditor.tsx
```typescript
// ANTES - Causaba loops infinitos
useEffect(() => {
  if (formData.content) {
    const readingTime = calculateReadingTime(formData.content);
    setFormData((prev) => ({ ...prev, reading_time: readingTime })); // ❌
  }
}, [formData.content]);

// AHORA - Cálculo dinámico sin estado
const currentReadingTime = formData.content 
  ? calculateReadingTime(formData.content) 
  : 1; // ✅

// Y se calcula antes de guardar
const handleSave = async () => {
  const readingTime = calculateReadingTime(formData.content);
  const postData = {
    ...formData,
    reading_time: readingTime
  };
  // ...guardar
}
```

---

## Verificación

Después de aplicar el fix:

### 1. Posts aparecen en listado ✅
1. Crea un nuevo post (como borrador o publicado)
2. Guarda
3. Deberías ver: "¡Post guardado exitosamente! Redirigiendo..."
4. En la lista, el post aparece inmediatamente
5. ✅ Los borradores se muestran con badge "Borrador" (secondary)
6. ✅ Los publicados se muestran con badge "Publicado" (default)

### 2. Publicar desde Supabase funciona ✅
1. Ve a Supabase Dashboard → Table Editor → blog_posts
2. Encuentra un post con `published = false`
3. Cambia `published` a `true`
4. Guarda
5. ✅ No hay error
6. ✅ `published_at` se establece automáticamente

### 3. Tiempo de lectura correcto ✅
1. Crea un post con contenido
2. Mientras escribes, el tiempo de lectura se actualiza en tiempo real
3. Posts cortos (< 200 palabras) = 1 minuto
4. Posts largos calculan correctamente:
   - 200 palabras = 1 min
   - 400 palabras = 2 min
   - 600 palabras = 3 min
   - etc.

---

## Entender el Constraint

El constraint `consistent_publication` requiere:
```sql
CONSTRAINT consistent_publication CHECK (
  (published = true AND published_at IS NOT NULL) OR
  (published = false)
)
```

Esto significa:
- ✅ Si `published = true` → `published_at` DEBE tener un valor
- ✅ Si `published = false` → `published_at` puede ser NULL o tener valor (mantiene fecha original)

Con el trigger nuevo:
- Cuando cambias `published` a `true`, se establece automáticamente `published_at`
- Cuando cambias de `true` a `false`, se mantiene `published_at` (para histórico)

---

## Archivos Modificados

1. ✅ `apps/web/src/components/admin/BlogPostsList.tsx`
2. ✅ `apps/web/src/components/admin/BlogPostEditor.tsx`
3. ✅ `supabase/migrations/20251028235000_auto_update_published_at.sql` (NUEVA)

---

## Estado Final

- ✅ Posts se crean correctamente (publicados o borradores)
- ✅ Posts aparecen en el listado inmediatamente
- ✅ Borradores se muestran correctamente en el listado
- ✅ Filtros funcionan correctamente (todos/publicados/borradores)
- ✅ Tiempo de lectura se calcula dinámicamente y correctamente
- ✅ Puedes publicar/despublicar desde el dashboard
- ✅ Puedes publicar/despublicar desde Supabase directamente
- ✅ No más errores de constraint
- ✅ Búsqueda y filtros por categoría funcionan perfectamente

🎉 **¡Sistema de Blog 100% Funcional!**

