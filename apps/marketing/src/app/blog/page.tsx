import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, ChevronRight, BookOpen, TrendingUp, Sparkles, MessageCircle, HelpCircle } from "lucide-react";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import Link from "next/link";
import Image from "next/image";

// ⚡ ISR: Revalidar cada 30 minutos
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Blog TuPatrimonio - Guías sobre Firma Electrónica y Digitalización",
  description: "Aprende sobre firma electrónica, verificación de identidad, notaría digital y digitalización de procesos. Guías prácticas y casos de éxito.",
  keywords: ["blog firma electrónica", "guías digitalización", "tutoriales notaría digital", "casos de éxito"],
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background via-[var(--tp-background-light)] to-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-[var(--tp-brand)] text-white px-4 py-2 text-base mb-6 shadow-lg">
              <Icon icon={BookOpen} size="sm" className="mr-2 text-white" />
              Blog TuPatrimonio
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Aprende con <span className="text-[var(--tp-brand)]">Nosotros</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10">
              Guías prácticas, consejos útiles y todo lo que necesitas saber sobre trámites legales. 
              Explicado de forma simple y cercana.
            </p>

            {/* Trust Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                <Icon icon={BookOpen} size="sm" className="text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">Guías paso a paso</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950 rounded-full">
                <Icon icon={Sparkles} size="sm" className="text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300 font-medium">Contenido actualizado</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={TrendingUp} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">Casos reales</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-8 border-b border-border">
          <div className="max-w-7xl tp-container">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/blog">
                <Button 
                  size="sm" 
                  className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-dark)] text-white shadow-sm"
                >
                  Todos los artículos
                </Button>
              </Link>
              {categories.map((category) => (
                <Link key={category.id} href={`/blog/categoria/${category.slug}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="hover:border-[var(--tp-brand)] hover:text-[var(--tp-brand)] transition-colors"
                  >
                    {category.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts */}
      <section className="py-12">
        <div className="max-w-7xl tp-container">
          {posts.length > 0 ? (
            <>
              {/* Featured Post */}
              {posts[0] && (
                <div className="mb-16">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon={Sparkles} size="md" className="text-[var(--tp-brand)]" />
                    <h2 className="text-2xl font-bold text-foreground">Artículo Destacado</h2>
                  </div>
                  <Card className="overflow-hidden border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                    <div className="md:flex">
                      <div className="md:w-2/5 relative overflow-hidden">
                        {posts[0].featured_image_url ? (
                          <Image 
                            src={posts[0].featured_image_url} 
                            alt={posts[0].title}
                            width={600}
                            height={400}
                            className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-64 md:h-full bg-gradient-to-br from-[var(--tp-brand-5)] to-[var(--tp-brand-10)] flex items-center justify-center">
                            <Icon icon={BookOpen} size="xl" className="text-[var(--tp-brand)] opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="md:w-3/5 p-8">
                        {posts[0].blog_categories && (
                          <Badge 
                            className="mb-4 bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)] text-[var(--tp-brand)]"
                            variant="outline"
                          >
                            {posts[0].blog_categories.name}
                          </Badge>
                        )}
                        <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 group-hover:text-[var(--tp-brand)] transition-colors">
                          {posts[0].title}
                        </h3>
                        <p className="text-lg text-muted-foreground mb-6">
                          {posts[0].excerpt}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center gap-2">
                            <Icon icon={User} size="sm" />
                            <span>{posts[0].author_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon icon={Clock} size="sm" />
                            <span>{posts[0].reading_time || 5} min de lectura</span>
                          </div>
                          <span>
                            {new Date(posts[0].published_at).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <Link href={`/blog/${(posts[0].blog_categories as any)?.slug || 'general'}/${posts[0].slug}`}>
                          <Button className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-dark)] text-white">
                            Leer Artículo Completo
                            <Icon icon={ChevronRight} size="sm" className="ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Other Posts */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Icon icon={BookOpen} size="md" className="text-[var(--tp-brand)]" />
                  <h2 className="text-2xl font-bold text-foreground">Más Artículos</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.slice(1).map((post) => (
                    <Link 
                      key={post.id}
                      href={`/blog/${(post.blog_categories as any)?.slug || 'general'}/${post.slug}`}
                      className="group"
                    >
                      <Card className="h-full border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all overflow-hidden">
                        <div className="relative overflow-hidden">
                          {post.featured_image_url ? (
                            <Image 
                              src={post.featured_image_url} 
                              alt={post.title}
                              width={400}
                              height={240}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-[var(--tp-brand-5)] to-[var(--tp-brand-10)] flex items-center justify-center">
                              <Icon icon={BookOpen} size="lg" className="text-[var(--tp-brand)] opacity-50" />
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          {post.blog_categories && (
                            <Badge 
                              className="mb-3 bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)] text-[var(--tp-brand)] w-fit"
                              variant="outline"
                            >
                              {post.blog_categories.name}
                            </Badge>
                          )}
                          <CardTitle className="text-xl line-clamp-2 group-hover:text-[var(--tp-brand)] transition-colors">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-3">
                            {post.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="font-medium">{post.author_name}</span>
                            <div className="flex items-center gap-1">
                              <Icon icon={Clock} size="sm" />
                              <span>{post.reading_time || 5} min</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Icon icon={BookOpen} size="xl" className="mx-auto mb-6 text-[var(--tp-brand)] opacity-50" />
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Próximamente: Contenido Increíble
              </h3>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Estamos preparando artículos exclusivos, guías prácticas y todo lo que necesitas saber sobre digitalización legal. ¡Muy pronto!
              </p>
              <Link href="/">
                <Button className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-dark)] text-white px-8">
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section con gradiente premium */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] relative overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl tp-container text-center relative z-10">
          <div className="mb-6">
            <Icon icon={MessageCircle} size="xl" variant="white" className="mx-auto" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            ¿Tienes alguna pregunta?
          </h2>
          
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Si no encontraste lo que buscabas en nuestros artículos, estamos aquí para ayudarte. 
            Escríbenos y te responderemos lo antes posible.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/contacto">
              <Button 
                size="lg" 
                className="bg-white text-[var(--tp-brand)] hover:bg-gray-100 dark:hover:bg-gray-200 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={MessageCircle} size="md" variant="inherit" className="mr-2" />
                Contáctanos
              </Button>
            </Link>
            
            <Link href="/base-conocimiento">
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white border-2 border-white hover:bg-white/10 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={HelpCircle} size="md" variant="white" className="mr-2" />
                Base de Conocimiento
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon={Clock} size="md" variant="white" />
              <span>Respuesta en menos de 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={BookOpen} size="md" variant="white" />
              <span>Contenido actualizado</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={TrendingUp} size="md" variant="white" />
              <span>Casos reales y prácticos</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
