# 🛠️ Guía de Desarrollo - TuPatrimonio

## 🚀 Quick Start

### Prerrequisitos
- Node.js 18+
- npm workspace support
- Git

### Instalación Inicial
```bash
# Clonar repositorio
git clone [repo-url]
cd tupatrimonio-app

# Instalar dependencias (puede fallar por workspace:* - es normal)
npm install

# Build packages compartidos primero
npm run build:location

# Iniciar development server
npm run dev:marketing    # Puerto 3001 (marketing)
npm run dev             # Puerto 3000 (web app)
```

## 📦 Packages y Dependencies

### Estructura del Monorepo
```
packages/
├── location/           # Sistema de ubicación compartido
│   ├── src/
│   │   ├── LocationManager.ts     # Detección híbrida
│   │   ├── CountryConfig.ts       # Configuración países
│   │   ├── hooks/useLocation.ts   # React hooks
│   │   └── components/CountrySelector.tsx
│   ├── package.json
│   └── tsconfig.json
└── ui/                # Estilos compartidos
    ├── globals.css    # Variables CSS centralizadas
    └── package.json
```

### Scripts Importantes
```bash
# Development
npm run dev:marketing        # Marketing app (puerto 3001)
npm run dev                 # Web app (puerto 3000)

# Build
npm run build:location      # Compilar package location primero
npm run build:marketing     # Build marketing app
npm run build:web          # Build web app  
npm run build              # Build todo (incluye packages)

# Utilidades
npm run lint               # Linting todas las apps
```

## 🌍 Sistema de Ubicación

### Configuración Local
En desarrollo, la detección funciona por:
1. **Zona horaria** del navegador (más precisa)
2. **Idioma** del navegador (backup)
3. **Default** a Chile si nada funciona

### APIs del Sistema
```typescript
// Hook principal
const { 
  country,        // 'cl', 'mx', 'co'
  countryInfo,    // { name, flag, currency, ... }
  source,         // 'netlify' | 'browser' | 'manual' | 'fallback'
  setCountry,     // Cambiar país manualmente
  formatCurrency  // Formatear precios automáticamente
} = useLocation();

// Para personalización en web app
const {
  formatCurrency,
  formatDate,
  getLocalizedContent
} = useCountryPersonalization();
```

### Debugging
```typescript
// En consola del navegador
import { LocationManager } from 'packages/location/src/LocationManager';

// Ver información de debugging
console.log(LocationManager.getDebugInfo());

// Resultado:
{
  timezone: "America/Santiago",
  language: "es-CL",
  currency: "CLP",
  localStorage: { ... }
}
```

## 🎨 Sistema de Estilos

### Variables CSS Centralizadas
Ubicación: `packages/ui/globals.css`

```css
/* Botones funcionales */
--tp-buttons: #404040;
--tp-buttons-hover: #555555;

/* Elementos de marca */
--tp-brand: #800039;
--tp-brand-light: #a50049;

/* Variaciones con opacidad */
--tp-buttons-10: #4040401a;
--tp-brand-20: #80003933;
```

### Uso en Componentes
```typescript
// Para botones funcionales
<Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">

// Para elementos de marca
<h1 className="text-[var(--tp-brand)]">TuPatrimonio</h1>

// Para fondos sutiles
<div className="bg-[var(--tp-brand-5)] border border-[var(--tp-brand-20)]">
```

## 🔧 Desarrollo por Aplicación

### Marketing App (`apps/marketing`)
```bash
cd apps/marketing
npm run dev                 # Puerto 3001

# Estructura importante:
src/app/
├── [country]/             # Páginas por país  
│   ├── firmas-electronicas/
│   ├── notaria-digital/
│   └── verificacion-identidad/
├── firmas-electronicas/   # Landing genérica (redirect)
├── blog/                  # Blog con categorías
└── layout.tsx            # Layout principal
```

### Web App (`apps/web`)
```bash
cd apps/web  
npm run dev                 # Puerto 3000
npm run generate-icons     # Generar íconos PWA
npm run pwa:test           # Test PWA (build + start)

# Estructura importante:
src/app/
├── dashboard/              # Dashboard principal
├── login/                  # Sistema de auth
├── auth/callback/          # OAuth callback
├── offline/               # Página offline PWA
└── layout.tsx             # Layout con LocationProvider + PWA
```

#### PWA Setup
```bash
# 1. Colocar ícono base (512x512px PNG)
cp tu-icono.png apps/web/public/icons/icon-base.png

# 2. Instalar dependencias
cd apps/web
npm install

# 3. Generar todos los íconos
npm run generate-icons

# 4. Test en producción local
npm run pwa:test
```

Ver documentación completa en `apps/web/README-PWA.md`

## 📸 Sistema de Imágenes del Blog

### Estructura de Storage en Supabase

El blog utiliza 6 buckets organizados en Supabase Storage:

| Bucket | Propósito | Tamaño Max | Formatos |
|--------|-----------|------------|----------|
| `blog-featured` | Imágenes destacadas de artículos | 5MB | jpg, png, webp, gif |
| `blog-content` | Imágenes dentro del contenido | 3MB | jpg, png, webp, gif |
| `blog-categories` | Iconos de categorías | 1MB | jpg, png, webp, svg |
| `blog-authors` | Avatares de autores | 1MB | jpg, png, webp |
| `blog-thumbnails` | Miniaturas optimizadas | 2MB | jpg, png, webp |
| `blog-meta` | Imágenes para SEO (og:image) | 2MB | jpg, png, webp |

**Acceso:** Todos los buckets son públicos para lectura. Solo usuarios autenticados pueden subir/modificar.

### Convenciones de Nomenclatura

Seguir estas convenciones al subir imágenes manualmente:

```
Featured:   {slug}-featured.webp
Content:    {slug}-content-1.webp, {slug}-content-2.webp, ...
Category:   {category-slug}-icon.webp
Author:     {author-slug}-avatar.webp
Meta:       {slug}-og.webp
```

**Ejemplos:**
```
guia-firma-electronica-chile-featured.webp
guia-firma-electronica-chile-content-1.webp
guia-firma-electronica-chile-content-2.webp
firma-electronica-icon.webp
maria-gonzalez-avatar.webp
guia-firma-electronica-chile-og.webp
```

### Tamaños Recomendados

| Tipo | Dimensiones | Formato Preferido |
|------|-------------|-------------------|
| Featured | 1200×630 px | WebP |
| Content | 800×600 px | WebP |
| Category Icon | 256×256 px | WebP o SVG |
| Author Avatar | 200×200 px | WebP |
| Meta (OG Image) | 1200×630 px | WebP |
| Thumbnail | 300×200 px | WebP |

**Tip:** Usa WebP para mejor compresión sin pérdida de calidad.

### Subir Imágenes Manualmente

#### Desde Supabase Dashboard:

1. Ir a **Storage** en el panel de Supabase
2. Seleccionar el bucket apropiado (ej: `blog-featured`)
3. Click en **Upload file**
4. Seleccionar la imagen siguiendo convenciones de nomenclatura
5. Confirmar upload

#### URLs Generadas:

Las imágenes públicas estarán disponibles en:
```
https://[project].supabase.co/storage/v1/object/public/blog-featured/guia-firma-electronica-chile-featured.webp
```

### Uso en Código

#### Helper Functions

```typescript
import { 
  getFeaturedImageUrl,
  getContentImageUrl,
  getCategoryIconUrl,
  getBlogImageUrl 
} from '@/lib/blog-images';

// Imagen destacada (optimizada)
const featuredUrl = getFeaturedImageUrl('guia-firma-electronica-chile', 'medium');

// Imagen de contenido
const contentUrl = getContentImageUrl('guia-firma-electronica-chile', 1, 'large');

// Icono de categoría
const iconUrl = getCategoryIconUrl('firma-electronica');

// URL directa con transformaciones
const customUrl = getBlogImageUrl(
  'featured', 
  'guia-firma-electronica-chile-featured.webp',
  'medium',  // thumbnail | small | medium | large | full
  80         // quality (1-100)
);
```

#### En Componentes con Next.js Image

```typescript
import Image from 'next/image';
import { getBlogImageProps } from '@/lib/blog-images';

export function BlogCard({ post }) {
  const imageProps = getBlogImageProps(
    post.featured_image_url,
    post.title,
    'medium'
  );

  return (
    <article>
      <Image {...imageProps} />
      <h2>{post.title}</h2>
    </article>
  );
}
```

#### Fallback para Imágenes Faltantes

```typescript
import { getImageUrlWithFallback } from '@/lib/blog-images';

// Si featured_image_url es null, usa placeholder
const safeUrl = getImageUrlWithFallback(
  post.featured_image_url,
  'featured'  // 'featured' | 'avatar' | 'icon'
);
```

### Campos en Base de Datos

#### blog_posts

```sql
-- Campo existente
featured_image_url TEXT  -- URL completa de Supabase Storage

-- Campo nuevo (agregado en migración)
content_images JSONB DEFAULT '[]'  -- Metadatos de imágenes en contenido
```

Ejemplo de `content_images`:
```json
[
  {
    "url": "https://[project].supabase.co/storage/v1/object/public/blog-content/guia-firma-electronica-chile-content-1.webp",
    "alt": "Ejemplo de firma electrónica",
    "caption": "Proceso de firma paso a paso",
    "order": 1,
    "width": 800,
    "height": 600
  }
]
```

#### blog_categories

```sql
-- Campo nuevo (agregado en migración)
icon_url TEXT  -- URL del icono de la categoría
```

### Optimización Automática

Las URLs generadas con helpers incluyen transformaciones de Supabase:

- **Resize:** Ajuste automático al tamaño solicitado
- **Format:** Conversión a WebP para mejor compresión
- **Quality:** Compresión ajustable (default 80%)
- **Lazy Loading:** Compatible con Next.js Image

```typescript
// Esto genera una URL optimizada automáticamente:
getBlogImageUrl('featured', 'imagen.jpg', 'medium')

// URL resultante incluye transformaciones:
// .../storage/v1/render/image/public/blog-featured/imagen.jpg?width=600&quality=80&format=webp
```

### Workflow Completo

1. **Crear artículo en BD:**
```sql
INSERT INTO marketing.blog_posts (title, slug, content, ...) 
VALUES ('Mi Artículo', 'mi-articulo', '...', ...);
```

2. **Subir imagen destacada:**
   - Ir a Storage > `blog-featured`
   - Upload: `mi-articulo-featured.webp` (1200×630 px)

3. **Actualizar URL en BD:**
```sql
UPDATE marketing.blog_posts
SET featured_image_url = 'https://[project].supabase.co/storage/v1/object/public/blog-featured/mi-articulo-featured.webp'
WHERE slug = 'mi-articulo';
```

4. **Verificar en Frontend:**
   - La imagen aparecerá automáticamente optimizada
   - Fallback se muestra si URL es null

## 🚦 Testing

### Verificar Sistema de Ubicación
```bash
# 1. Ir a http://localhost:3001/firmas-electronicas
# 2. Verificar detección automática
# 3. Probar selector manual
# 4. Confirmar persistencia en localStorage
```

### Verificar Estilos
```bash
# 1. Confirmar colores vino en elementos de marca
# 2. Confirmar colores grises en botones
# 3. Verificar popup del selector
```

## 🐛 Troubleshooting

### Problemas Comunes

#### "Can't resolve @tupatrimonio/location"
```bash
# Solución: Compilar package location
npm run build:location
```

#### Estilos no se aplican
```bash
# Verificar que globals.css se importe correctamente
# apps/marketing/src/app/layout.tsx
import "../../../../packages/ui/globals.css";
```

#### Edge Functions no funcionan localmente
```bash
# Normal - Solo funcionan en producción Netlify
# Localmente usa fallback a detección por navegador
```

#### PWA: Service Worker no se registra
```bash
# El Service Worker solo funciona en:
# - Producción (NODE_ENV=production)
# - HTTPS o localhost
# - Para testing: npm run pwa:test
```

#### PWA: Íconos no aparecen
```bash
# Solución: Generar íconos desde ícono base
npm run generate-icons

# Verificar que existan en:
ls apps/web/public/icons/
```

## 📝 Agregando Nuevas Páginas por País

### 1. Crear página específica
```typescript
// apps/marketing/src/app/cl/nuevo-servicio/page.tsx
export const metadata = {
  title: "Nuevo Servicio Chile | TuPatrimonio",
  // ... metadata específico
};

export default function NuevoServicioChile() {
  return (
    <div>
      <header>
        <h1>TuPatrimonio Chile</h1>
        <CountrySelector variant="minimal" />
      </header>
      {/* Contenido específico Chile */}
    </div>
  );
}
```

### 2. Crear landing genérica  
```typescript
// apps/marketing/src/app/nuevo-servicio/page.tsx
'use client'

import { useLocation } from 'packages/location/src/hooks/useLocation';

export default function NuevoServicioLanding() {
  const { country, countryInfo } = useLocation();
  
  // Auto-redirect logic similar a firmas-electronicas
  return <div>{/* Landing con selector */}</div>;
}
```

### 3. Actualizar Edge Function
```typescript
// netlify/edge-functions/country-redirect.ts
const needsCountryRedirect = [
  '/firmas-electronicas',
  '/notaria-digital', 
  '/verificacion-identidad',
  '/nuevo-servicio'        // ← Agregar aquí
].includes(pathname);
```

## 🔄 Git Workflow

### Branches
- `main`: Producción estable
- `desarrollo`: Development activo
- `feature/*`: Features específicas

### Commits
```bash
# Compilar location package antes de commit
npm run build:location

# Commit normal
git add .
git commit -m "feat: nueva funcionalidad"
```

## 🔐 Sistema de Roles y Permisos

### Organización Platform

El sistema usa una organización especial "TuPatrimonio Platform" para administrar permisos del equipo interno.

**Tipos de organizaciones:**
- `personal`: Usuarios individuales (B2C)
- `business`: Empresas (B2B)
- `platform`: Equipo TuPatrimonio (acceso administrativo)

### Roles de Plataforma

| Rol | Slug | Nivel | Permisos |
|-----|------|-------|----------|
| Platform Super Admin | `platform_super_admin` | 10 | Acceso total al sistema |
| Marketing Admin | `marketing_admin` | 7 | Gestión de contenido marketing |

### Permisos del Blog

**Lectura pública:** Cualquier usuario puede leer posts publicados

**Gestión (crear/editar/eliminar):** Solo admins de plataforma
- Blog posts
- Categorías
- FAQs
- Testimonios
- Case studies
- Newsletter subscribers (vista)
- Contact messages (vista)
- Waitlist subscribers (vista)

### Storage Buckets y Permisos

| Bucket | Tipo | Lectura | Escritura |
|--------|------|---------|-----------|
| `marketing-images` | Público | Todos | Platform admins |
| `public-assets` | Público | Todos | Platform admins |
| `documents` | Privado | Owner + admins | Owner + admins |
| `ai-training-data` | Privado | Platform admins | Platform admins |

### Setup de Usuarios Admin

**⚠️ Ejecutar después de aplicar migración `20251024190000_platform-organization-setup.sql`**

Ver guía completa en: `supabase/SETUP-ADMIN-USERS.md`

**Pasos rápidos:**
1. Aplicar migración
2. Crear usuario en Supabase Auth Dashboard
3. Ejecutar SQL para vincular a org platform (ver `setup-admin-example.sql`)
4. Verificar con `SELECT marketing.is_platform_admin()`

### Verificar Permisos

```sql
-- Ver tus roles
SELECT 
  o.name as organization,
  r.name as role,
  ou.status
FROM core.organization_users ou
JOIN core.organizations o ON o.id = ou.organization_id
JOIN core.roles r ON r.id = ou.role_id
WHERE ou.user_id = auth.uid();

-- Verificar si eres admin platform
SELECT marketing.is_platform_admin();  -- Debe retornar true
```

### Troubleshooting Permisos

**"No puedo crear posts en el blog"**
- Verifica que `marketing.is_platform_admin()` retorna `true`
- Verifica que estás en la org platform con rol apropiado
- Ver política RLS: `SELECT * FROM pg_policies WHERE tablename = 'blog_posts'`

**"Storage rechaza mis uploads"**
- Verifica permisos del bucket: `SELECT * FROM storage.policies WHERE bucket_id = 'marketing-images'`
- Confirma que eres platform admin
- Ver buckets: `SELECT * FROM storage.buckets`

## 📊 Google Analytics 4 y Search Console

### Configuración Inicial

#### 1. Crear Propiedad en Google Analytics 4

**Importante:** Crear propiedad nueva para `tupatrimonio.app` (separada del `.io` existente)

1. Ir a https://analytics.google.com
2. Click en **Admin** (engranaje abajo a la izquierda)
3. En "Property", click **Create Property**
4. Configurar:
   - Property name: `TuPatrimonio Marketing`
   - Reporting time zone: `(GMT-04:00) Santiago`
   - Currency: `Chilean Peso (CLP)`
5. Business info → Industry: `Technology` o `Legal Services`
6. Click **Create**
7. Crear **Web Data Stream**:
   - URL: `https://tupatrimonio.app`
   - Stream name: `Marketing Site`
   - ✅ Enhanced measurement (dejar activado)
8. **Copiar Measurement ID** (formato: `G-XXXXXXXXXX`)

#### 2. Configurar en el Proyecto

Agregar variables de entorno en Netlify:

**Variable:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`  
**Value:** `G-XXXXXXXXXX` (tu Measurement ID)

**Variable:** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`  
**Value:** El código de verificación de Search Console (ver paso 3)

#### 3. Configurar Google Search Console

1. Ir a https://search.google.com/search-console
2. Click **Add property** → Seleccionar **URL prefix**
3. Ingresar: `https://tupatrimonio.app`
4. **Método de verificación:** HTML tag
5. Copiar el código de verificación (el valor del `content` attribute)
6. Agregar como variable de entorno (paso 2)
7. Después del deploy, volver y click **Verify**
8. **Submit sitemap:** En Search Console → Sitemaps → Agregar `sitemap.xml`

### Eventos Personalizados

El sistema trackea automáticamente estos eventos:

| Evento | Descripción | Parámetros |
|--------|-------------|------------|
| `form_submit` | Submit de formularios | `form_name`, `country`, `use_case` |
| `cta_click` | Click en CTAs principales | `cta_text`, `cta_location` |
| `page_view` | Vistas de página | Automático por GA4 |

### Agregar Tracking Personalizado

```typescript
// En cualquier componente client-side
import { trackEvent } from '@/lib/analytics';

// Trackear evento custom
trackEvent('button_click', {
  button_id: 'hero-cta',
  page: 'homepage'
});

// Trackear conversión
trackEvent('conversion', {
  conversion_type: 'signup',
  value: 0
});
```

### Verificación

**GA4 en tiempo real:**
1. Ir a Google Analytics
2. Reports → Realtime
3. Abrir tupatrimonio.app en otra pestaña
4. Deberías aparecer en el mapa en tiempo real

**Search Console:**
1. Verificar propiedad (después del deploy)
2. Esperar 24-48hrs para primeros datos
3. Verificar que sitemap fue procesado

### Debugging

**Analytics no aparece:**
- Verificar que estás en producción (no funciona en localhost)
- Verificar variable de entorno en Netlify
- Abrir DevTools → Console, buscar errores de gtag
- Verificar en Network tab que se carga `gtag/js`

**Search Console no verifica:**
- Verificar que la variable de entorno está configurada
- Hacer redeploy después de agregar la variable
- Verificar el meta tag en el HTML source de la página

### Structured Data

El sitio incluye automáticamente:
- **Organization schema** (todas las páginas)
- **WebSite schema** (todas las páginas)
- **Article schema** (posts del blog)
- **Breadcrumb schema** (donde aplique)

**Validar structured data:**
- https://search.google.com/test/rich-results
- https://validator.schema.org/

---

**Para más detalles**: Ver `docs/DEPLOYMENT.md` para deploy o `docs/ARCHITECTURE.md` para decisiones técnicas.
