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
    
    // Service pages por país
    if (route.includes('/firmas-electronicas') || route.includes('/verificacion-identidad') || route.includes('/notaria-online')) {
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
    
    // Legal pages
    if (route.includes('/legal/')) {
      return { changeFrequency: 'monthly', priority: 0.3 };
    }
    
    // Generic/redirect pages
    if (['/firmas-electronicas', '/verificacion-identidad', '/notaria-online'].includes(route)) {
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
    // Homepage global
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    
    // Chile-specific pages (high priority) - solo las que sabemos que están públicas
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
      url: `${baseUrl}/cl/precios`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/cl/notaria-online`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cl/verificacion-identidad`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    
    // Otros países (Próximamente)
    {
      url: `${baseUrl}/mx`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/co`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pe`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ar`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    
    // Páginas globales
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
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
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ] : [];

  // Dynamic blog posts from Supabase
  let blogPosts: Array<{url: string; lastModified: Date; changeFrequency: 'monthly'; priority: number}> = [];
  try {
    const supabase = createClient();
    const { data: posts } = await supabase
      .from('marketing.blog_posts')
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
      .from('marketing.blog_categories')
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
      .from('marketing.kb_articles')
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
      .from('marketing.kb_categories')
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
