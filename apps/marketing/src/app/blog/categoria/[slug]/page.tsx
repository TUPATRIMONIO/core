import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Clock, User, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ⚡ ISR: Revalidar cada 1 hora
export const revalidate = 3600;

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  
  try {
    const { data: category, error } = await supabase
      .schema('marketing')
      .from('blog_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return category;
  } catch (error) {
    console.error('Error in getCategoryBySlug:', error);
    return null;
  }
}

async function getPostsByCategory(categoryId: string) {
  const supabase = await createClient();
  
  try {
    const { data: posts, error } = await supabase
      .schema('marketing')
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        author_name,
        published_at,
        reading_time,
        view_count,
        category_id,
        blog_categories (
          name,
          slug,
          color
        )
      `)
      .eq('published', true)
      .eq('category_id', categoryId)
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching posts by category:', error);
      return [];
    }

    return posts || [];
  } catch (error) {
    console.error('Error in getPostsByCategory:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Categoría no encontrada | TuPatrimonio",
    };
  }

  return {
    title: `${category.name} - Blog TuPatrimonio`,
    description: category.description || `Artículos sobre ${category.name}. Guías, tutoriales y casos de éxito en TuPatrimonio.`,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `${category.name} - Blog TuPatrimonio`,
      description: category.description || `Artículos sobre ${category.name}`,
      url: `https://tupatrimonio.app/blog/categoria/${slug}`,
    },
  };
}

// ⚡ ISR: Pre-generar todas las categorías activas
export async function generateStaticParams() {
  const supabase = await createClient();
  
  try {
    const { data: categories, error } = await supabase
      .schema('marketing')
      .from('blog_categories')
      .select('slug')
      .eq('is_active', true);

    if (error || !categories) {
      return [];
    }

    return categories.map((cat) => ({
      slug: cat.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const posts = await getPostsByCategory(category.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/blog" className="hover:text-[var(--tp-buttons)] transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-4">
              <span 
                className="inline-block text-sm px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl text-gray-600">
                {category.description}
              </p>
            )}
            <div className="mt-6 text-sm text-gray-500">
              {posts.length} {posts.length === 1 ? 'artículo' : 'artículos'}
            </div>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article 
                  key={post.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-md transition-shadow"
                >
                  {post.featured_image_url ? (
                    <Image 
                      src={post.featured_image_url} 
                      alt={post.title}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Imagen</span>
                    </div>
                  )}
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
                    <Link href={`/blog/${(post.blog_categories as any)?.slug || 'general'}/${post.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Leer Más
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="mb-6">
                <span 
                  className="inline-block text-sm px-4 py-2 rounded-full text-white font-medium"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Aún no hay artículos en esta categoría
              </h3>
              <p className="text-gray-600 mb-8">
                Estamos preparando contenido exclusivo sobre {category.name}
              </p>
              <Link href="/blog">
                <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Ver Todos los Artículos
                </Button>
              </Link>
            </div>
          )}

          {/* Back to Blog */}
          {posts.length > 0 && (
            <div className="mt-12 text-center">
              <Link href="/blog">
                <Button variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Ver Todas las Categorías
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

