import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tupatrimonio.app';
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/firmas-electronicas`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/verificacion-identidad`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/notaria-digital`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/precios`,
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
      url: `${baseUrl}/legal/terminos`,
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
      url: `${baseUrl}/legal/cookies`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  // Dynamic blog posts from Supabase
  let blogPosts: Array<{url: string; lastModified: Date; changeFrequency: 'monthly'; priority: number}> = [];
  try {
    const supabase = createClient();
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (posts) {
      blogPosts = posts.map(post => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
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

  return [
    ...staticPages,
    ...blogPosts,
    ...categoryPages,
  ];
}
