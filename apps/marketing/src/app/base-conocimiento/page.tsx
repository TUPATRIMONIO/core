import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Search, Star, TrendingUp } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand-5)] to-white">
        <div className="max-w-7xl tp-container">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[var(--tp-brand)] text-white rounded-full px-4 py-2 mb-6">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Centro de Ayuda</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Base de Conocimiento
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Encuentra respuestas a tus preguntas sobre firma electrónica, 
              verificación de identidad y servicios legales digitales.
            </p>

            {/* Search Bar (placeholder for future implementation) */}
            <div className="relative max-w-2xl mx-auto">
              <div className="flex items-center gap-3 bg-white rounded-full shadow-lg px-6 py-4 border border-gray-200">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  className="flex-1 outline-none text-gray-700"
                  disabled
                />
                <Button size="sm" className="bg-[var(--tp-brand)]">
                  Buscar
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
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
                >
                  <Card className="h-full hover:shadow-xl transition-all hover:border-[var(--tp-brand)] cursor-pointer group">
                    <CardHeader>
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <BookOpen 
                          className="w-6 h-6" 
                          style={{ color: category.color }}
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
              <div className="col-span-full text-center text-gray-500 py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No hay categorías disponibles aún.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="py-16 bg-white">
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
              <Star className="w-8 h-8 text-yellow-500" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article: any) => {
                const category = article.kb_categories;
                return (
                  <Link
                    key={article.id}
                    href={`/base-conocimiento/${category?.slug || 'general'}/${article.slug}`}
                  >
                    <Card className="h-full hover:shadow-xl transition-all hover:border-[var(--tp-brand)] cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: `${category?.color || '#800039'}15`,
                              color: category?.color || '#800039'
                            }}
                          >
                            {category?.name || 'General'}
                          </span>
                          {article.view_count > 100 && (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2 hover:text-[var(--tp-brand)] transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {article.excerpt || 'Lee este artículo para obtener más información.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
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

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl tp-container">
          <Card className="bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] text-white border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">
                ¿No encuentras lo que buscas?
              </CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Nuestro equipo de soporte está listo para ayudarte
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contacto">
                <Button variant="outline" size="lg" className="bg-card text-[var(--tp-brand)] hover:bg-gray-100">
                  Contactar Soporte
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="ghost" size="lg" className="text-white border-white hover:bg-white/10">
                  Ver Preguntas Frecuentes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

