interface StructuredDataProps {
  data: any
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Helper para generar Organization schema
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TuPatrimonio",
    "url": "https://tupatrimonio.app",
    "logo": "https://tupatrimonio.app/logo.png",
    "description": "Plataforma de firma electrónica, verificación de identidad y notaría digital para empresas en LATAM",
    "foundingDate": "2025",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CL"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "contacto@tupatrimonio.app"
    }
  }
}

// Helper para generar WebSite schema
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TuPatrimonio",
    "url": "https://tupatrimonio.app",
    "description": "Firma electrónica, verificación de identidad y notaría digital",
    "publisher": {
      "@type": "Organization",
      "name": "TuPatrimonio"
    }
  }
}

// Helper para generar Article schema (posts del blog)
export function generateArticleSchema(post: {
  title: string
  excerpt?: string
  author_name: string
  published_at: string
  featured_image_url?: string
  seo_description?: string
  content: string
  reading_time?: number
  category?: string
  slug: string
  categorySlug?: string
}) {
  const baseUrl = "https://tupatrimonio.app"
  const url = `${baseUrl}/blog/${post.categorySlug || 'general'}/${post.slug}`
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.seo_description || post.excerpt,
    "image": post.featured_image_url || `${baseUrl}/default-blog-image.jpg`,
    "datePublished": post.published_at,
    "author": {
      "@type": "Person",
      "name": post.author_name
    },
    "publisher": {
      "@type": "Organization",
      "name": "TuPatrimonio",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "url": url,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "articleSection": post.category || "General",
    "wordCount": post.content.split(/\s+/).length,
    "timeRequired": `PT${post.reading_time || 5}M`
  }
}

// Helper para generar BreadcrumbList schema
export function generateBreadcrumbSchema(items: Array<{name: string; url?: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url ? { "item": item.url } : {})
    }))
  }
}

