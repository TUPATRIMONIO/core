import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server';
import { Button } from "@/components/ui/button";
import { Clock, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog TuPatrimonio - Guías sobre Firma Electrónica y Digitalización",
  description: "Aprende sobre firma electrónica, verificación de identidad, notaría digital y digitalización de procesos. Guías prácticas y casos de éxito.",
  keywords: ["blog firma electrónica", "guías digitalización", "tutoriales notaría digital", "casos de éxito"],
  openGraph: {
    title: "Blog TuPatrimonio - Guías sobre Digitalización Legal",
    description: "Aprende sobre firma electrónica, verificación de identidad y digitalización de procesos legales.",
    url: "https://tupatrimonio.app/blog",
  },
};

async function getBlogPosts() {
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
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }

    return posts || [];
  } catch (error) {
    console.error('Error in getBlogPosts:', error);
    return [];
  }
}

async function getBlogCategories() {
  const supabase = await createClient();
  
  try {
    const { data: categories, error } = await supabase
      .schema('marketing')
      .from('blog_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return categories || [];
  } catch (error) {
    console.error('Error in getBlogCategories:', error);
    return [];
  }
}

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getBlogCategories()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Blog <span className="text-[var(--tp-brand)]">TuPatrimonio</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Guías, tutoriales y casos de éxito sobre digitalización de procesos legales
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/blog">
              <Button variant="outline" size="sm" className="bg-[var(--tp-buttons)] text-white border-[var(--tp-buttons)]">
                Todos
              </Button>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/blog/categoria/${category.slug}`}>
                <Button variant="outline" size="sm">
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <>
              {/* Featured Post */}
              {posts[0] && (
                <div className="mb-12">
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
                    <div className="md:flex">
                      <div className="md:w-1/3">
                        {posts[0].featured_image_url ? (
                          <Image 
                            src={posts[0].featured_image_url} 
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
                      </div>
                      <div className="md:w-2/3 p-8">
                        {posts[0].blog_categories && (
                          <div className="mb-3">
                            <span 
                              className="text-sm px-3 py-1 rounded-full text-white"
                              style={{ backgroundColor: posts[0].blog_categories.color }}
                            >
                              {posts[0].blog_categories.name}
                            </span>
                          </div>
                        )}
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                          {posts[0].title}
                        </h2>
                        <p className="text-gray-600 mb-6">
                          {posts[0].excerpt}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{posts[0].author_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{posts[0].reading_time || 5} min de lectura</span>
                          </div>
                          <span>
                            {new Date(posts[0].published_at).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                        <Link href={`/blog/${(posts[0].blog_categories as any)?.slug || 'general'}/${posts[0].slug}`}>
                          <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                            Leer Artículo
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Posts */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.slice(1).map((post) => (
                  <article key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-md transition-shadow">
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
            </>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Próximamente: Contenido Increíble
              </h3>
              <p className="text-gray-600 mb-8">
                Estamos preparando artículos exclusivos sobre digitalización legal
              </p>
              <Link href="/">
                <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
