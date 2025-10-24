# @tupatrimonio/utils

Paquete de utilidades compartidas para TuPatrimonio.

## Instalación

En tu app dentro del monorepo:

```json
{
  "dependencies": {
    "@tupatrimonio/utils": "*"
  }
}
```

## Image Helpers

Utilidades para gestionar imágenes del blog en Supabase Storage.

### Uso Básico

```typescript
import {
  getFeaturedImageUrl,
  getContentImageUrl,
  getBlogImageUrl,
  getBlogImageSrcSet,
  type ImageSize,
  type BlogImageType,
} from '@tupatrimonio/utils/image-helpers';

// Obtener imagen destacada optimizada
const url = getFeaturedImageUrl('mi-articulo', 'medium');

// Obtener imagen de contenido
const contentUrl = getContentImageUrl('mi-articulo', 1, 'large');

// URL personalizada con transformaciones
const customUrl = getBlogImageUrl(
  'featured',
  'mi-archivo.jpg',
  'medium',
  80 // quality
);

// Múltiples tamaños para srcset
const srcSet = getBlogImageSrcSet('featured', 'mi-archivo.jpg', ['small', 'medium', 'large']);
```

### Tipos de Imagen

- `featured` - Imágenes destacadas de artículos
- `content` - Imágenes dentro del contenido
- `category` - Iconos de categorías
- `author` - Avatares de autores
- `meta` - Imágenes para SEO (og:image)
- `thumbnail` - Miniaturas

### Tamaños Disponibles

- `thumbnail` - 150px
- `small` - 300px
- `medium` - 600px
- `large` - 1200px
- `full` - Original sin transformaciones

### Funciones Disponibles

#### `getPublicImageUrl(bucket, path)`
Obtiene URL pública de Supabase Storage.

#### `getOptimizedImageUrl(bucket, path, options)`
Genera URL con transformaciones de Supabase.

```typescript
const url = getOptimizedImageUrl('blog-featured', 'imagen.jpg', {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp',
  resize: 'cover'
});
```

#### `getBlogImageUrl(type, filename, size?, quality?)`
Helper específico para blog con tamaños predefinidos.

#### `getBlogImageSrcSet(type, filename, sizes, quality?)`
Genera múltiples tamaños para srcset responsivo.

#### `validateImageFile(file, type)`
Valida archivo antes de subir.

```typescript
const result = validateImageFile(file, 'featured');
if (!result.valid) {
  console.error(result.error);
}
```

#### `generateUniqueFilename(originalName, prefix?)`
Genera nombre único con timestamp.

#### `buildImagePath(type, slug, suffix?, extension?)`
Construye path según convenciones del proyecto.

### Helpers de Conveniencia

```typescript
// Imagen destacada
const url = getFeaturedImageUrl('guia-firma-electronica', 'medium');

// Imagen de contenido (con índice)
const url = getContentImageUrl('guia-firma-electronica', 1, 'large');

// Icono de categoría
const url = getCategoryIconUrl('firma-electronica');

// Avatar de autor
const url = getAuthorAvatarUrl('maria-gonzalez', 'small');

// Imagen meta para SEO
const url = getMetaImageUrl('guia-firma-electronica');
```

## Configuración

Asegúrate de tener la variable de entorno configurada:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
```

## Estructura de Buckets

| Bucket | Tamaño Max | Formatos |
|--------|------------|----------|
| `blog-featured` | 5MB | jpg, png, webp, gif |
| `blog-content` | 3MB | jpg, png, webp, gif |
| `blog-categories` | 1MB | jpg, png, webp, svg |
| `blog-authors` | 1MB | jpg, png, webp |
| `blog-thumbnails` | 2MB | jpg, png, webp |
| `blog-meta` | 2MB | jpg, png, webp |

## Desarrollo

```bash
# Compilar
npm run build

# Watch mode
npm run dev

# Limpiar dist
npm run clean
```

## Licencia

Privado - TuPatrimonio

