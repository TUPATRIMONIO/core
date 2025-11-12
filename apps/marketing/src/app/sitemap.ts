import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/client';
import { getPublicPagesForSitemap } from '@/lib/page-management';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tupatrimonio.app';
  
  // Función para determinar prioridad y frecuencia por ruta
  function getPriorityByRoute(route: string): { changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number } {
    // Homepage principal
    if (route === '/') return { changeFrequency: 'daily', priority: 1.0 };
    
    // Country homepages
    if (route.match(/^\/[a-z]{2}$/)) {
      if (route === '/cl') return { changeFrequency: 'daily', priority: 0.95 };
      return { changeFrequency: 'weekly', priority: 0.8 };
    }
    
    // Páginas globales principales
    if (route === '/ayuda') return { changeFrequency: 'weekly', priority: 0.85 };
    if (route === '/nosotros') return { changeFrequency: 'monthly', priority: 0.75 };
    if (route === '/contacto') return { changeFrequency: 'weekly', priority: 0.8 };
    if (route === '/base-conocimiento') return { changeFrequency: 'weekly', priority: 0.75 };
    
    // Líneas de negocio
    if (route === '/legal-tech') return { changeFrequency: 'weekly', priority: 0.85 };
    if (route === '/business-hub') return { changeFrequency: 'weekly', priority: 0.7 };
    if (route === '/proptech') return { changeFrequency: 'weekly', priority: 0.7 };
    if (route === '/fintech') return { changeFrequency: 'weekly', priority: 0.7 };
    
    // Service pages por país
    if (route.includes('/firmas-electronicas') || 
        route.includes('/modificaciones-empresa') || 
        route.includes('/notaria-online') ||
        route.includes('/contrato-de-arriendo-online')) {
      return route.startsWith('/cl') 
        ? { changeFrequency: 'weekly', priority: 0.9 }
        : { changeFrequency: 'monthly', priority: 0.6 };
    }
    
    // Pricing pages
    if (route.includes('/precios')) {
      return route.startsWith('/cl')
        ? { changeFrequency: 'weekly', priority: 0.85 }
        : { changeFrequency: 'monthly', priority: 0.7 };
    }
    
    // Contact pages
    if (route.includes('/contacto')) {
      return { changeFrequency: 'weekly', priority: 0.8 };
    }
    
    // Blog
    if (route.startsWith('/blog')) {
      if (route === '/blog') return { changeFrequency: 'daily', priority: 0.8 };
      return { changeFrequency: 'monthly', priority: 0.7 };
    }
    
    // Knowledge Base
    if (route.startsWith('/base-conocimiento')) {
      if (route === '/base-conocimiento') return { changeFrequency: 'weekly', priority: 0.75 };
      if (route.includes('/categoria/')) return { changeFrequency: 'weekly', priority: 0.6 };
      return { changeFrequency: 'monthly', priority: 0.7 };
    }
    
    // Legal pages
    if (route.includes('/legal/')) {
      return { changeFrequency: 'monthly', priority: 0.3 };
    }
    
    // Generic/redirect pages
    if (['/firmas-electronicas', '/modificaciones-empresa', '/notaria-online', '/precios'].includes(route)) {
      return { changeFrequency: 'monthly', priority: 0.6 };
    }
    
    // Default
    return { changeFrequency: 'monthly', priority: 0.5 };
  }

  // Obtener páginas públicas del sistema de gestión
  let managedPages: Array<{url: string; lastModified: Date; changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number}> = [];
  
  try {
    const publicPages = await getPublicPagesForSitemap();
    managedPages = publicPages.map(page => ({
      url: `${baseUrl}${page.route_path}`,
      lastModified: new Date(page.updated_at),
      changeFrequency: getPriorityByRoute(page.route_path).changeFrequency,
      priority: getPriorityByRoute(page.route_path).priority,
    }));
  } catch (error) {
    console.error('Error getting managed pages for sitemap:', error);
  }
  
  // Si no hay páginas gestionadas, usar páginas estáticas como fallback
  const fallbackStaticPages = managedPages.length === 0 ? [
    // ==========================================
    // HOMEPAGE GLOBAL
    // ==========================================
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    
    // ==========================================
    // PÁGINAS GLOBALES - Alta prioridad
    // ==========================================
    {
      url: `${baseUrl}/ayuda`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/base-conocimiento`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    },
    
    // ==========================================
    // LÍNEAS DE NEGOCIO
    // ==========================================
    {
      url: `${baseUrl}/legal-tech`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/business-hub`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/proptech`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/fintech`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    
    // ==========================================
    // PÁGINAS DE REDIRECCIÓN (Detección de país)
    // ==========================================
    {
      url: `${baseUrl}/firmas-electronicas`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/modificaciones-empresa`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/notaria-online`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/precios`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    
    // ==========================================
    // CHILE - Servicios Principales
    // ==========================================
    {
      url: `${baseUrl}/cl`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/cl/firmas-electronicas`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cl/modificaciones-empresa`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cl/notaria-online`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cl/contrato-de-arriendo-online`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/cl/precios`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    
    // ==========================================
    // PÁGINAS LEGALES (Baja prioridad)
    // ==========================================
    {
      url: `${baseUrl}/legal/terminos`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/cookies`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    
    // ==========================================
    // NOTA: Países como MX, CO, PE, AR están en estado "coming-soon"
    // y NO deben incluirse en el sitemap hasta que estén públicos
    // según la configuración en PAGE_CONFIG
    // ==========================================
  ] : [];

  // Dynamic blog posts from Supabase
  let blogPosts: Array<{url: string; lastModified: Date; changeFrequency: 'monthly'; priority: number}> = [];
  try {
    const supabase = createClient();
    const { data: posts } = await supabase
      .from('blog_posts')
      .select(`
        slug,
        updated_at,
        published_at,
        blog_categories (slug)
      `)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (posts) {
      blogPosts = posts.map(post => {
        const categorySlug = (post.blog_categories as any)?.slug || 'general';
        return {
          url: `${baseUrl}/blog/${categorySlug}/${post.slug}`,
          lastModified: new Date(post.updated_at || post.published_at),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        };
      });
    }
  } catch (error) {
    console.error('Error generating sitemap for blog posts:', error);
    // Continue without blog posts if there's an error
  }

  // Dynamic blog categories
  let categoryPages: Array<{url: string; lastModified: Date; changeFrequency: 'weekly'; priority: number}> = [];
  try {
    const supabase = createClient();
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('slug')
      .eq('is_active', true);

    if (categories) {
      categoryPages = categories.map(category => ({
        url: `${baseUrl}/blog/categoria/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Error generating sitemap for categories:', error);
    // Continue without categories if there's an error
  }

  // Knowledge Base articles
  let kbArticles: Array<{url: string; lastModified: Date; changeFrequency: 'monthly'; priority: number}> = [];
  try {
    const supabase = createClient();
    const { data: articles } = await supabase
      .from('kb_articles')
      .select(`
        slug,
        updated_at,
        published_at,
        kb_categories (slug)
      `)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (articles) {
      kbArticles = articles.map(article => {
        const categorySlug = (article.kb_categories as any)?.slug || 'general';
        return {
          url: `${baseUrl}/base-conocimiento/${categorySlug}/${article.slug}`,
          lastModified: new Date(article.updated_at || article.published_at),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        };
      });
    }
  } catch (error) {
    console.error('Error generating sitemap for KB articles:', error);
  }

  // Knowledge Base categories
  let kbCategories: Array<{url: string; lastModified: Date; changeFrequency: 'weekly'; priority: number}> = [];
  try {
    const supabase = createClient();
    const { data: kbCats } = await supabase
      .from('kb_categories')
      .select('slug')
      .eq('is_active', true);

    if (kbCats) {
      kbCategories = kbCats.map(category => ({
        url: `${baseUrl}/base-conocimiento/categoria/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Error generating sitemap for KB categories:', error);
  }

  return [
    ...(managedPages.length > 0 ? managedPages : fallbackStaticPages),
    ...blogPosts,
    ...categoryPages,
    ...kbArticles,
    ...kbCategories,
  ];
}
