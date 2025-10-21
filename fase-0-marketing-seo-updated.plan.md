# Fase 0: Marketing Web + SEO Foundation (Actualizada)

## Objetivo

Establecer presencia digital y SEO foundation mientras desarrollamos el backend. Esta fase es crítica porque el SEO toma 3-6 meses en mostrar resultados.

**Implementación:** Supabase + Hardcodeado (speed to market)

## 1. Setup Marketing Site (apps/marketing)

### 1.1 Crear estructura básica

- Configurar Next.js app en `/apps/marketing`
- Setup TailwindCSS + Shadcn/UI compartido desde `/packages/ui`
- Configurar variables CSS desde `globals.css` (fuente Quicksand)
- Setup básico de SEO (metadata API, sitemap, robots.txt)

### 1.2 Landing pages principales (Hardcodeadas)

Crear estas páginas con contenido SEO-optimizado hardcodeado:

**Homepage (`/`)**
- Hero con value proposition clara
- Sección de servicios principales
- Social proof (logos placeholder + testimonios)
- CTA principal "Empieza Gratis"

**Servicios tradicionales (prioridad):**
- `/firmas-electronicas` - Landing específica SEO-optimizada
- `/verificacion-identidad` - Para compliance officers y fintechs  
- `/notaria-digital` - Disruption del modelo tradicional

**Páginas de soporte:**
- `/precios` - Pricing con planes B2C/B2B diferenciados
- `/legal/terminos` - Términos de servicio
- `/legal/privacidad` - Privacy policy
- `/legal/cookies` - Cookie policy

## 2. Configuración Híbrida: Supabase + Hardcodeado

### 2.1 Landing Pages (Hardcodeadas)

- Contenido SEO-optimizado directamente en componentes Next.js
- Control total sobre performance y SEO
- Fácil iteración y cambios rápidos
- Sin dependencias externas ($0 extra cost)

### 2.2 Blog (Supabase Tables)

Crear tabla en Supabase para contenido dinámico:

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  category TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  seo_title TEXT,
  seo_description TEXT
);

-- Índices para performance
CREATE INDEX idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
```

### 2.3 Admin Simple (Opcional)

Panel básico para gestión de blog posts:
- Formulario para crear/editar posts
- Preview antes de publicar
- Gestión de categorías
- Ubicación: `/admin/blog` (protegido)

## 3. Blog Operacional

### 3.1 Estructura técnica

- `/blog` - Index con posts recientes (desde Supabase)
- `/blog/[slug]` - Post individual (dynamic route)
- `/blog/categoria/[categoria]` - Archive por categoría

### 3.2 Implementación Next.js

```typescript
// app/blog/page.tsx
import { createClient } from '@/lib/supabase/client'

export default async function BlogPage() {
  const supabase = createClient()
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div>
      <h1>Blog TuPatrimonio</h1>
      {posts?.map(post => (
        <ArticleCard key={post.id} post={post} />
      ))}
    </div>
  )
}

// app/blog/[slug]/page.tsx  
export default async function BlogPost({ params }) {
  const supabase = createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .single()

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

### 3.3 Categorías principales

- Firma Electrónica
- Verificación de Identidad  
- Notaría Digital
- Compliance
- Guías y Tutoriales

### 3.4 Contenido inicial (crearemos juntos)

- 5-6 blog posts iniciales sobre servicios tradicionales
- 1 pillar article: "Guía Completa de Firma Electrónica en Chile 2025"

## 4. SEO Foundation

### 4.1 Technical SEO

- Metadata API configurada correctamente
- Structured data (Schema.org JSON-LD) para cada tipo de página
- Sitemap XML dinámico (incluye posts desde Supabase)
- OpenGraph y Twitter Cards
- Performance optimization (automático con Netlify)

### 4.2 Content SEO

- Keywords research para servicios tradicionales
- Optimización on-page para cada landing
- Internal linking strategy
- Meta descriptions y titles optimizados

### 4.3 Sitemap Dinámico

```typescript
// app/sitemap.ts
import { createClient } from '@/lib/supabase/server'

export default async function sitemap() {
  const supabase = createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .eq('published', true)
  
  return [
    { url: 'https://tupatrimonio.app', changeFrequency: 'daily' },
    { url: 'https://tupatrimonio.app/firmas-electronicas', changeFrequency: 'weekly' },
    { url: 'https://tupatrimonio.app/verificacion-identidad', changeFrequency: 'weekly' },
    { url: 'https://tupatrimonio.app/notaria-digital', changeFrequency: 'weekly' },
    { url: 'https://tupatrimonio.app/precios', changeFrequency: 'weekly' },
    ...posts?.map(post => ({
      url: `https://tupatrimonio.app/blog/${post.slug}`,
      lastModified: post.published_at,
      changeFrequency: 'monthly',
    })) || []
  ]
}
```

## 5. Deploy y DNS

### 5.1 Netlify configuration

- Conectar repositorio GitHub  
- Build settings para monorepo (`cd apps/marketing && npm run build`)
- Variables de entorno para Supabase
- Deploy automático en push a main

### 5.2 Dominio

- Configurar `tupatrimonio.app` apuntando a Netlify
- SSL automático
- Redirects si es necesario

## 6. Analytics y Tracking

### 6.1 Setup inicial

- Google Analytics 4
- Google Search Console
- Basic conversion tracking (form submissions, CTA clicks)

## Deliverables al completar Fase 0

- Marketing site live en `tupatrimonio.app`
- 5-6 landing pages con contenido SEO-optimizado (hardcodeadas)
- Blog operacional con 5-6 posts iniciales (Supabase)
- SEO foundation técnico completo
- Analytics tracking activo
- Formularios de contacto/waitlist funcionando
- **$0 en herramientas adicionales (solo usa Supabase existente)**

## Ventajas de esta Implementación

✅ **Speed to Market**: 1-2 semanas vs 4-6 con CMS externo
✅ **$0 Extra Cost**: Solo usa Supabase que ya tienes
✅ **Control Total**: SEO optimizado sin dependencies
✅ **Performance**: Landing pages estáticas = velocidad máxima
✅ **Familiar**: Ya conoces Supabase
✅ **Escalable**: Migrar a CMS externo cuando crezca el equipo

## To-dos Actualizados

- [ ] Crear estructura del marketing site en apps/marketing con Next.js y TailwindCSS
- [ ] Crear homepage y landing pages hardcodeadas con contenido SEO-optimizado
- [ ] Crear tabla blog_posts en Supabase e implementar páginas dinámicas del blog  
- [ ] Implementar SEO técnico: metadata API, structured data, sitemap dinámico
- [ ] Crear contenido inicial: copy para landing pages y 5-6 blog posts
- [ ] Configurar deploy en Netlify, DNS para tupatrimonio.app y analytics
- [ ] (Opcional) Crear admin simple para gestión de blog posts
