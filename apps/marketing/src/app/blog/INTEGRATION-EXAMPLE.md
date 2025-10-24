# Ejemplo de Integración de Image Helpers en Blog

Este documento muestra cómo integrar los helpers de imágenes en los componentes del blog.

## 1. Actualizar page.tsx para usar helpers

### Opción A: Mantener URLs desde BD (Recomendado para inicio)

Si ya tienes URLs completas en `featured_image_url`, mantén el código actual pero agrega soporte para fallback:

```typescript
import Image from "next/image";
import { getImageUrlWithFallback } from "@/lib/blog-images";

// En el componente
{posts[0].featured_image_url ? (
  <Image 
    src={getImageUrlWithFallback(posts[0].featured_image_url, 'featured')}
    alt={posts[0].title}
    width={400}
    height={256}
    className="w-full h-64 md:h-full object-cover"
  />
) : (
  <div className="w-full h-64 md:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
    <span className="text-gray-500 font-medium">Imagen del artículo</span>
  </div>
)}
```

### Opción B: Usar helpers para construir URLs (Para imágenes en Storage)

Si sigues las convenciones de nomenclatura y las imágenes están en Storage:

```typescript
import Image from "next/image";
import { getFeaturedImageUrl, getImageUrlWithFallback } from "@/lib/blog-images";

// En el componente
const featuredUrl = posts[0].featured_image_url || 
  getFeaturedImageUrl(posts[0].slug, 'medium');

<Image 
  src={featuredUrl}
  alt={posts[0].title}
  width={600}
  height={400}
  className="w-full h-64 md:h-full object-cover"
/>
```

### Opción C: Helper completo con props (Más limpio)

```typescript
import Image from "next/image";
import { getBlogImageProps } from "@/lib/blog-images";

// En el componente
const imageProps = getBlogImageProps(
  posts[0].featured_image_url,
  posts[0].title,
  'medium'
);

<Image {...imageProps} />
```

## 2. Crear componente reutilizable BlogImage

Crea `apps/marketing/src/components/BlogImage.tsx`:

```typescript
import Image from 'next/image';
import { getBlogImageProps, getImageUrlWithFallback } from '@/lib/blog-images';

interface BlogImageProps {
  url: string | null | undefined;
  alt: string;
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'full';
  className?: string;
  fallbackType?: 'featured' | 'avatar' | 'icon';
  priority?: boolean;
}

export function BlogImage({ 
  url, 
  alt, 
  size = 'medium',
  className = '',
  fallbackType = 'featured',
  priority = false 
}: BlogImageProps) {
  const imageProps = getBlogImageProps(url, alt, size);
  const safeUrl = getImageUrlWithFallback(url, fallbackType);

  return (
    <Image
      {...imageProps}
      src={safeUrl}
      className={`object-cover ${className}`}
      priority={priority}
    />
  );
}
```

Uso:

```typescript
import { BlogImage } from '@/components/BlogImage';

<BlogImage
  url={post.featured_image_url}
  alt={post.title}
  size="medium"
  className="w-full h-64 rounded-lg"
/>
```

## 3. Ejemplo completo de card actualizado

```typescript
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { BlogImage } from '@/components/BlogImage';

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-md transition-shadow">
      <BlogImage
        url={post.featured_image_url}
        alt={post.title}
        size="medium"
        className="w-full h-48"
      />
      
      <div className="p-6">
        {post.blog_categories && (
          <div className="mb-3">
            <span 
              className="text-xs px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: post.blog_categories.color }}
            >
              {post.blog_categories.name}
            </span>
          </div>
        )}
        
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {post.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{post.author_name}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{post.reading_time || 5} min</span>
          </div>
        </div>
        
        <Link href={`/blog/${post.slug}`}>
          <Button variant="outline" size="sm" className="w-full">
            Leer Más
          </Button>
        </Link>
      </div>
    </article>
  );
}
```

## 4. Agregar iconos a categorías

Si agregaste `icon_url` a las categorías:

```typescript
import { BlogImage } from '@/components/BlogImage';

{categories.map((category) => (
  <Link key={category.id} href={`/blog/categoria/${category.slug}`}>
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      {category.icon_url && (
        <BlogImage
          url={category.icon_url}
          alt={category.name}
          size="thumbnail"
          fallbackType="icon"
          className="w-5 h-5"
        />
      )}
      {category.name}
    </Button>
  </Link>
))}
```

## 5. Página individual de artículo

En `apps/marketing/src/app/blog/[slug]/page.tsx`:

```typescript
import { BlogImage } from '@/components/BlogImage';
import { getMetaImageUrl } from '@/lib/blog-images';

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      images: [
        {
          url: post.featured_image_url || getMetaImageUrl(post.slug),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Image */}
      <div className="mb-8">
        <BlogImage
          url={post.featured_image_url}
          alt={post.title}
          size="large"
          className="w-full h-96 rounded-2xl"
          priority
        />
      </div>

      {/* Content */}
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <MarkdownContent content={post.content} />
    </article>
  );
}
```

## 6. Responsive srcset para mejor performance

```typescript
import Image from 'next/image';
import { getBlogImageSrcSet } from '@/lib/blog-images';

export function ResponsiveBlogImage({ post }: { post: BlogPost }) {
  // Asumiendo que sigues convenciones de nomenclatura
  const filename = `${post.slug}-featured.webp`;
  const srcSet = getBlogImageSrcSet('featured', filename, ['small', 'medium', 'large']);

  return (
    <Image
      src={srcSet.medium}
      srcSet={`
        ${srcSet.small} 300w,
        ${srcSet.medium} 600w,
        ${srcSet.large} 1200w
      `}
      sizes="(max-width: 768px) 300px, (max-width: 1024px) 600px, 1200px"
      alt={post.title}
      width={1200}
      height={630}
      className="w-full h-auto"
    />
  );
}
```

## Notas Importantes

1. **URLs Existentes:** Si ya tienes URLs completas en la BD, los helpers funcionan como fallback y validación
2. **Placeholders:** Los SVG placeholder se muestran automáticamente si no hay imagen
3. **Optimización:** Supabase transforma las imágenes automáticamente (resize, format, quality)
4. **Lazy Loading:** Next.js Image maneja lazy loading automáticamente
5. **Priority:** Usa `priority={true}` solo en la imagen hero del artículo

## Migración Gradual

Puedes migrar gradualmente:

1. **Fase 1:** Agregar fallbacks con `getImageUrlWithFallback`
2. **Fase 2:** Crear componente `BlogImage` reutilizable
3. **Fase 3:** Usar helpers para nuevas imágenes que sigas convenciones
4. **Fase 4:** Migrar imágenes existentes a Storage siguiendo convenciones

