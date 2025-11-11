import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Search, Star, TrendingUp, HelpCircle, Zap, Shield, Clock, MessageCircle } from 'lucide-react';
import { Icon, IconContainer } from '@tupatrimonio/ui';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Base de Conocimiento - TuPatrimonio | Centro de Ayuda',
  description: 'Encuentra respuestas a tus preguntas sobre servicios legales digitales. Guías, tutoriales y documentación completa sobre TuPatrimonio.',
  keywords: ['ayuda', 'soporte', 'guías', 'tutoriales', 'base de conocimiento', 'faq', 'documentación'],
};

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidar cada hora

export default async function BaseConocimientoPage() {
  let categories: any[] = [];
  let featuredArticles: any[] = [];

  try {
    const supabase = await createClient();
    
    // Obtener categorías activas
    const { data: categoriesData } = await supabase
      .schema('marketing')
      .from('kb_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (categoriesData) categories = categoriesData;

    // Obtener artículos destacados
    const { data: featuredData } = await supabase
      .schema('marketing')
      .from('kb_articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        reading_time,
        view_count,
        category_id,
        kb_categories (name, slug, color, icon)
      `)
      .eq('published', true)
      .eq('featured', true)
      .order('view_count', { ascending: false })
      .limit(6);
    
    if (featuredData) featuredArticles = featuredData;
  } catch (error) {
    console.error('Error loading KB data:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background via-[var(--tp-background-light)] to-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-[var(--tp-brand)] text-white px-4 py-2 text-base mb-6 shadow-lg">
              <Icon icon={BookOpen} size="sm" className="mr-2 text-white" />
              Centro de Ayuda
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Base de <span className="text-[var(--tp-brand)]">Conocimiento</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10">
              ¿Tienes dudas? Aquí encontrarás respuestas claras y fáciles de entender. 
              Sin tecnicismos, sin complicaciones.
            </p>

            {/* Trust Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm mb-10">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                <Icon icon={BookOpen} size="sm" className="text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">Guías paso a paso</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                <Icon icon={Zap} size="sm" className="text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">Respuestas rápidas</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950 rounded-full">
                <Icon icon={HelpCircle} size="sm" className="text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300 font-medium">Fácil de entender</span>
              </div>
            </div>

            {/* Search Bar (placeholder for future implementation) */}
            <div className="relative max-w-2xl mx-auto">
              <div className="flex items-center gap-3 bg-card rounded-full shadow-lg px-6 py-4 border-2 border-border">
                <Icon icon={Search} size="md" className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  className="flex-1 outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
                  disabled
                />
                <Button size="sm" className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-dark)] text-white">
                  Buscar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Búsqueda próximamente disponible
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explora por Categoría
            </h2>
            <p className="text-lg text-muted-foreground">
              Navega por nuestras categorías para encontrar lo que necesitas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/base-conocimiento/categoria/${category.slug}`}
                  className="group"
                >
                  <Card className="h-full border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                    <CardHeader>
                      <div className="mb-4 group-hover:scale-110 transition-transform">
                        <IconContainer 
                          icon={BookOpen}
                          variant="brand" 
                          shape="rounded" 
                          size="lg"
                        />
                      </div>
                      <CardTitle className="text-lg group-hover:text-[var(--tp-brand)] transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription>
                        {category.description || 'Ver artículos'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-12">
                <Icon icon={BookOpen} size="xl" className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p>No hay categorías disponibles aún.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl tp-container">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Artículos Populares
                </h2>
                <p className="text-lg text-muted-foreground">
                  Los artículos más útiles de nuestra comunidad
                </p>
              </div>
              <Icon icon={Star} size="xl" className="text-yellow-500" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article: any) => {
                const category = article.kb_categories;
                return (
                  <Link
                    key={article.id}
                    href={`/base-conocimiento/${category?.slug || 'general'}/${article.slug}`}
                    className="group"
                  >
                    <Card className="h-full border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-semibold bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)] text-[var(--tp-brand)]"
                          >
                            {category?.name || 'General'}
                          </Badge>
                          {article.view_count > 100 && (
                            <Icon icon={TrendingUp} size="sm" className="text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-[var(--tp-brand)] transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {article.excerpt || 'Lee este artículo para obtener más información.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{article.reading_time} min lectura</span>
                          <span>•</span>
                          <span>{article.view_count} vistas</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section con gradiente premium */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] relative overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl tp-container text-center relative z-10">
          <div className="mb-6">
            <Icon icon={HelpCircle} size="xl" variant="white" className="mx-auto" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            ¿No encuentras lo que buscas?
          </h2>
          
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            No te preocupes. Estamos aquí para ayudarte con lo que necesites. 
            Habla con nosotros y encontraremos la solución juntos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/contacto">
              <Button 
                size="lg" 
                className="bg-white text-[var(--tp-brand)] hover:bg-gray-100 dark:hover:bg-gray-200 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={MessageCircle} size="md" variant="inherit" className="mr-2" />
                Contactar Soporte
              </Button>
            </Link>
            
            <Link href="/ayuda">
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white border-2 border-white hover:bg-white/10 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={HelpCircle} size="md" variant="white" className="mr-2" />
                Centro de Ayuda
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon={Clock} size="md" variant="white" />
              <span>Respuesta en menos de 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Shield} size="md" variant="white" />
              <span>Información segura y confiable</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={MessageCircle} size="md" variant="white" />
              <span>Soporte cercano y humano</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

