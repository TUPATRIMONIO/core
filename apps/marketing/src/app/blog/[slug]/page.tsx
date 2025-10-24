import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Clock, User, ChevronLeft, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MarkdownContent } from "@/components/MarkdownContent";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

async function getBlogPost(slug: string) {
  const supabase = await createClient();
  
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        content,
        excerpt,
        featured_image_url,
        author_name,
        published_at,
        reading_time,
        view_count,
        seo_title,
        seo_description,
        category_id,
        blog_categories!category_id (
          name,
          slug,
          color
        )
      `)
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id);

    return post;
  } catch (error) {
    console.error('Error in getBlogPost:', error);
    return null;
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Post no encontrado | TuPatrimonio",
    };
  }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      url: `https://tupatrimonio.app/blog/${slug}`,
      images: post.featured_image_url ? [
        {
          url: post.featured_image_url,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ] : [],
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author_name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver al Blog
            </Button>
          </Link>
        </div>
      </div>

      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8">
            {post.blog_categories && (
              <div className="mb-4">
                <Link href={`/blog/categoria/${post.blog_categories.slug}`}>
                  <span 
                    className="text-sm px-3 py-1 rounded-full text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: post.blog_categories.color }}
                  >
                    {post.blog_categories.name}
                  </span>
                </Link>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6">
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.reading_time || 5} min de lectura</span>
                </div>
                <span>
                  {new Date(post.published_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="mb-8">
              <Image 
                src={post.featured_image_url} 
                alt={post.title}
                width={800}
                height={400}
                className="w-full h-64 md:h-96 object-cover rounded-xl"
              />
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <MarkdownContent content={post.content} />
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 bg-[var(--tp-buttons)]/5 rounded-xl p-8 text-center border">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Listo para digitalizar tus procesos?
            </h3>
            <p className="text-gray-600 mb-6">
              Únete a más de 500 empresas que ya transformaron su gestión documental
            </p>
            <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] px-8">
              Comenzar Gratis
            </Button>
          </div>

          {/* Back to Blog */}
          <div className="mt-8 text-center">
            <Link href="/blog">
              <Button variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Ver Más Artículos
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
